import { useState } from "react";
import {
  Button,
  Flex,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
} from "@chakra-ui/react";
import { WalletBalanceQuery, WalletQuery, WalletTokensQuery } from "applesauce-wallet/queries";
import { useActionHub, useActiveAccount, useStoreQuery } from "applesauce-react/hooks";
import { CompleteSpend } from "applesauce-wallet/actions";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import SimpleView from "../../../components/layout/presets/simple-view";
import CashuMintName from "../../../components/cashu/cashu-mint-name";
import WalletUnlockButton from "../components/wallet-unlock-button";
import RouterLink from "../../../components/router-link";
import { getEncodedToken, Proof, Token } from "@cashu/cashu-ts";
import { dumbTokenSelection, getTokenContent } from "applesauce-wallet/helpers";
import { getCashuWallet } from "../../../services/cashu-mints";

export default function WalletSendCashuView() {
  const navigate = useNavigate();
  const account = useActiveAccount()!;
  const wallet = useStoreQuery(WalletQuery, [account.pubkey]);
  const balance = useStoreQuery(WalletBalanceQuery, [account.pubkey]);
  const tokens = useStoreQuery(WalletTokensQuery, [account.pubkey, false]);

  const { register, getValues, watch, handleSubmit, formState } = useForm({
    defaultValues: { amount: 0, mint: "" },
    mode: "all",
  });

  watch("mint");

  const actions = useActionHub();
  const submit = handleSubmit(async (values) => {
    if (!tokens) return;
    const selected = dumbTokenSelection(tokens, values.amount, values.mint);
    const wallet = await getCashuWallet(values.mint);

    // get the proofs
    const selectedProofs = selected
      .map((t) => getTokenContent(t)!)
      .reduce((arr, token) => [...arr, ...token.proofs], [] as Proof[]);

    // swap
    const send = await wallet.send(values.amount, selectedProofs);

    // save the change
    await actions.run(CompleteSpend, selected, { proofs: send.keep, mint: values.mint });

    // redirect to the token view
    const token: Token = {
      mint: values.mint,
      proofs: send.send,
    };
    navigate("/wallet/send/token", { state: { token: getEncodedToken(token) } });
  });

  return (
    <SimpleView as="form" title="Send Cashu" maxW="xl" center onSubmit={submit}>
      {wallet?.locked && <WalletUnlockButton colorScheme="primary" mx="auto" size="lg" w="sm" />}

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
        <Button type="submit" colorScheme="primary" isLoading={formState.isSubmitting} isDisabled={!formState.isValid}>
          Create
        </Button>
        <Button as={RouterLink} to="/wallet" me="auto">
          Cancel
        </Button>
      </Flex>
    </SimpleView>
  );
}
