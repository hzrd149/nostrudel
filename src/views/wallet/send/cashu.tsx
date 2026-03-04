import { getEncodedToken } from "@cashu/cashu-ts";
import { Button, Flex, Input, Select } from "@chakra-ui/react";
import { useActionRunner, useActiveAccount, useEventModel } from "applesauce-react/hooks";
import { TokensOperation } from "applesauce-wallet/actions";
import { isWalletUnlocked } from "applesauce-wallet/helpers";
import { WalletBalanceModel } from "applesauce-wallet/models";
import { WalletQuery } from "../../../models/wallet";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import CashuMintName from "../../../components/cashu/cashu-mint-name";
import SimpleView from "../../../components/layout/presets/simple-view";
import RouterLink from "../../../components/router-link";
import couch from "../../../services/cashu-couch";
import WalletUnlockButton from "../components/wallet-unlock-button";
import useAsyncAction from "../../../hooks/use-async-action";

export default function WalletSendCashuView() {
  const navigate = useNavigate();
  const account = useActiveAccount()!;
  const walletEvent = useEventModel(WalletQuery, [account.pubkey]);
  const balance = useEventModel(WalletBalanceModel, [account.pubkey]);

  const defaultMint = balance && Object.keys(balance).reduce((a, b) => (balance[a] > balance[b] ? a : b));

  const { register, getValues, watch, handleSubmit, formState } = useForm({
    defaultValues: { amount: 0, mint: defaultMint ?? "" },
    mode: "all",
  });

  watch("mint");

  const actions = useActionRunner();

  const { run: submit, loading } = useAsyncAction(
    async (values: { amount: number; mint: string }) => {
      let outboundToken: string | undefined;

      await actions.run(
        TokensOperation,
        values.amount,
        async ({ selectedProofs, mint, cashuWallet }) => {
          // swap proofs for a clean send token
          const { keep, send } = await cashuWallet.ops.send(values.amount, selectedProofs).run();

          // encode for QR / clipboard display
          outboundToken = getEncodedToken({ mint, proofs: send, unit: "sat" });

          return { change: keep.length > 0 ? keep : undefined };
        },
        { mint: values.mint || undefined, couch },
      );

      if (outboundToken) navigate("/wallet/send/token", { state: { token: outboundToken } });
    },
    [actions, navigate],
  );

  const onSubmit = handleSubmit((values) => submit(values));

  return (
    <SimpleView as="form" title="Send Cashu" maxW="xl" center onSubmit={onSubmit}>
      {walletEvent && !isWalletUnlocked(walletEvent) && (
        <WalletUnlockButton wallet={walletEvent} colorScheme="primary" mx="auto" size="lg" w="sm" />
      )}

      <Select {...register("mint", { required: true })} isRequired>
        {balance &&
          Object.entries(balance).map(([mint, amount]) => (
            <option key={mint} value={mint}>
              <CashuMintName mint={mint} /> ({amount})
            </option>
          ))}
      </Select>
      <Input
        size="lg"
        type="number"
        min={1}
        max={getValues("mint") && balance ? balance[getValues("mint")] : undefined}
        {...register("amount", {
          required: true,
          min: 1,
          max: getValues("mint") && balance ? balance[getValues("mint")] : undefined,
          valueAsNumber: true,
        })}
      />

      <Flex direction="row-reverse">
        <Button
          type="submit"
          colorScheme="primary"
          isLoading={loading || formState.isSubmitting}
          isDisabled={!formState.isValid}
        >
          Create
        </Button>
        <Button as={RouterLink} to="/wallet" me="auto">
          Cancel
        </Button>
      </Flex>
    </SimpleView>
  );
}
