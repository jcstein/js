import { Spinner } from "../../../components/Spinner";
import {
  CreateLocalWallet_Guest,
  CreateLocalWallet_Password,
} from "./CreateLocalWallet";
import { ReconnectLocalWallet } from "./ReconnectLocalWallet";
import { Flex } from "../../../components/basic";
import { ConnectUIProps } from "@thirdweb-dev/react-core";
import { useLocalWalletInfo } from "./useLocalWalletInfo";
import type { LocalWallet } from "@thirdweb-dev/wallets";

export const LocalWalletConnectUI = (
  props: ConnectUIProps<LocalWallet> & { persist: boolean },
) => {
  const { walletData } = useLocalWalletInfo(props.walletConfig, props.persist);

  if (!props.persist) {
    return (
      <CreateLocalWallet_Guest
        persist={props.persist}
        localWallet={props.walletConfig}
        goBack={props.goBack}
        onConnect={props.close}
      />
    );
  }

  if (walletData === "loading") {
    return (
      <Flex
        justifyContent="center"
        alignItems="center"
        style={{
          height: "300px",
        }}
      >
        <Spinner size="lg" color="primary" />
      </Flex>
    );
  }

  if (walletData) {
    return (
      <ReconnectLocalWallet
        renderBackButton={props.supportedWallets.length > 1}
        supportedWallets={props.supportedWallets}
        onConnect={props.close}
        goBack={props.goBack}
        localWallet={props.walletConfig}
        persist={props.persist}
      />
    );
  }

  return (
    <CreateLocalWallet_Password
      goBack={props.goBack}
      localWalletConf={props.walletConfig}
      onConnect={props.close}
      renderBackButton={props.supportedWallets.length > 1}
      persist={props.persist}
    />
  );
};
