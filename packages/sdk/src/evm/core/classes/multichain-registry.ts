import { NetworkOrSignerOrProvider, TransactionResult } from "..";
import { getMultichainRegistryAddress } from "../../constants/addresses";
import { PublishedMetadata } from "../../schema/contracts/custom";
import { SDKOptions } from "../../schema/sdk-options";
import { AddContractInput, ContractInput, DeployedContract } from "../../types";
import { ContractWrapper } from "./contract-wrapper";
import type {
  TWMultichainRegistry,
  MultichainRegistryCore,
} from "@thirdweb-dev/contracts-js";
import RegistryCoreABI from "@thirdweb-dev/contracts-js/dist/abis/MultichainRegistryCore.json";
import RegistryRouterABI from "@thirdweb-dev/contracts-js/dist/abis/TWMultichainRegistry.json";
import { ThirdwebStorage } from "@thirdweb-dev/storage";
import { constants, utils } from "ethers";

/**
 * @internal
 */
export class MultichainRegistry {
  private registryCore: ContractWrapper<MultichainRegistryCore>;
  private registryRouter: ContractWrapper<TWMultichainRegistry>;
  private storage: ThirdwebStorage;

  constructor(
    network: NetworkOrSignerOrProvider,
    storage: ThirdwebStorage,
    options: SDKOptions = {},
  ) {
    this.storage = storage;
    this.registryCore = new ContractWrapper<MultichainRegistryCore>(
      network,
      getMultichainRegistryAddress(),
      RegistryCoreABI,
      options,
    );

    this.registryRouter = new ContractWrapper<TWMultichainRegistry>(
      network,
      getMultichainRegistryAddress(),
      RegistryRouterABI,
      options,
    );
  }

  public async updateSigner(signer: NetworkOrSignerOrProvider) {
    this.registryCore.updateSignerOrProvider(signer);
    this.registryRouter.updateSignerOrProvider(signer);
  }

  public async getContractMetadataURI(
    chainId: number,
    address: string,
  ): Promise<string> {
    return await this.registryCore.readContract.getMetadataUri(
      chainId,
      address,
    );
  }

  public async getContractMetadata(
    chainId: number,
    address: string,
  ): Promise<PublishedMetadata> {
    const uri = await this.getContractMetadataURI(chainId, address);
    if (!uri) {
      throw new Error(
        `No metadata URI found for contract ${address} on chain ${chainId}`,
      );
    }
    // TODO define the metadata JSON schema
    return await this.storage.downloadJSON<PublishedMetadata>(uri);
  }

  public async getContractAddresses(
    walletAddress: string,
  ): Promise<DeployedContract[]> {
    return (await this.registryCore.readContract.getAll(walletAddress))
      .filter(
        (result) =>
          utils.isAddress(result.deploymentAddress) &&
          result.deploymentAddress.toLowerCase() !== constants.AddressZero,
      )
      .map((result) => ({
        address: result.deploymentAddress,
        chainId: result.chainId.toNumber(),
      }));
  }

  public async addContract(
    contract: AddContractInput,
  ): Promise<TransactionResult> {
    return await this.addContracts([contract]);
  }

  public async addContracts(
    contracts: AddContractInput[],
  ): Promise<TransactionResult> {
    const deployerAddress = await this.registryRouter.getSignerAddress();
    const encoded: string[] = [];
    contracts.forEach((contact) => {
      encoded.push(
        this.registryCore.readContract.interface.encodeFunctionData("add", [
          deployerAddress,
          contact.address,
          contact.chainId,
          contact.metadataURI || "",
        ]),
      );
    });

    return {
      receipt: await this.registryRouter.multiCall(encoded),
    };
  }

  public async removeContract(
    contract: ContractInput,
  ): Promise<TransactionResult> {
    return await this.removeContracts([contract]);
  }

  public async removeContracts(
    contracts: ContractInput[],
  ): Promise<TransactionResult> {
    const deployerAddress = await this.registryRouter.getSignerAddress();
    const encoded: string[] = [];
    contracts.forEach((contract) => {
      encoded.push(
        this.registryCore.readContract.interface.encodeFunctionData("remove", [
          deployerAddress,
          contract.address,
          contract.chainId,
        ]),
      );
    });

    return {
      receipt: await this.registryRouter.multiCall(encoded),
    };
  }
}
