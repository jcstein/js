import { ContractWrapper } from "../../core/classes/contract-wrapper";
import type { IERC20 } from "@thirdweb-dev/contracts-js";
import ERC20Abi from "@thirdweb-dev/contracts-js/dist/abis/IERC20.json";
import { BigNumber, type BigNumberish, utils } from "ethers";

export async function approveErc20Allowance(
  contractToApprove: ContractWrapper<any>,
  currencyAddress: string,
  price: BigNumber,
  quantity: BigNumberish,
  tokenDecimals: number,
) {
  const signer = contractToApprove.getSigner();
  const provider = contractToApprove.getProvider();
  const erc20 = new ContractWrapper<IERC20>(
    signer || provider,
    currencyAddress,
    ERC20Abi,
    contractToApprove.options,
  );
  const owner = await contractToApprove.getSignerAddress();
  const spender = contractToApprove.readContract.address;
  const allowance = await erc20.readContract.allowance(owner, spender);
  const totalPrice = BigNumber.from(price)
    .mul(BigNumber.from(quantity))
    .div(utils.parseUnits("1", tokenDecimals));
  if (allowance.lt(totalPrice)) {
    await erc20.sendTransaction("approve", [
      spender,
      allowance.add(totalPrice),
    ]);
  }
}
