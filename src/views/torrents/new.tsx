import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Textarea,
  UseRadioProps,
  VisuallyHiddenInput,
  useRadio,
  useRadioGroup,
} from "@chakra-ui/react";
import { sha1 } from "@noble/hashes/sha1";
import { bytesToHex } from "@noble/hashes/utils";
import dayjs from "dayjs";
import { EventTemplate, nip19 } from "nostr-tools";
import { PropsWithChildren, ReactNode, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import VerticalPageLayout from "../../components/vertical-page-layout";
import { Category, TORRENT_KIND, torrentCatagories } from "../../helpers/nostr/torrents";
import { BencodeValue, decode, encode } from "../../lib/bencode";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import { usePublishEvent } from "../../providers/global/publish-provider";

function RadioCard(props: UseRadioProps & PropsWithChildren) {
  const { getInputProps, getRadioProps } = useRadio(props);

  const input = getInputProps();
  const checkbox = getRadioProps();

  return (
    <Box as="label">
      <input {...input} />
      <Button
        as="div"
        {...checkbox}
        cursor="pointer"
        variant="outline"
        colorScheme={checkbox["data-checked"] !== undefined ? "primary" : undefined}
        px="3"
        py="1"
        size="sm"
      >
        {props.children}
      </Button>
    </Box>
  );
}

export default function NewTorrentView() {
  const publish = usePublishEvent();
  const navigate = useNavigate();
  const torrentFileInput = useRef<HTMLInputElement | null>(null);

  const smallLayout = useBreakpointValue({ base: true, lg: false });
  const { getValues, watch, setValue, register, handleSubmit, formState } = useForm({
    defaultValues: {
      title: "",
      description: "",
      btih: "",
      tags: [] as string[],
      files: [] as {
        name: string;
        size: number;
      }[],
    },
  });

  const selectTorrentFile = async (file: File) => {
    const buf = await file.arrayBuffer();
    const torrent = decode(new Uint8Array(buf)) as Record<string, BencodeValue>;
    const infoBuf = encode(torrent["info"]);
    const info = torrent["info"] as {
      files?: Array<{ length: number; path: Array<Uint8Array> }>;
      length: number;
      name: Uint8Array;
    };

    const dec = new TextDecoder();
    setValue("title", dec.decode(info.name));
    const comment = dec.decode(torrent["comment"] as Uint8Array | undefined) ?? "";
    if (comment) setValue("description", comment);
    setValue("btih", bytesToHex(sha1(infoBuf)));
    setValue("tags", []);
    const files = (info.files ?? [{ length: info.length, path: [info.name] }]).map((a) => ({
      size: a.length,
      name: a.path.map((b) => dec.decode(b)).join("/"),
    }));
    setValue("files", files);
  };

  const onSubmit = handleSubmit(async (values) => {
    const draft: EventTemplate = {
      kind: TORRENT_KIND,
      content: values.description,
      tags: [
        ["title", values.title],
        ["x", values.btih],
        ...values.tags.map((v) => ["t", v]),
        ...values.files.map((f) => ["file", f.name, String(f.size)]),
      ],
      created_at: dayjs().unix(),
    };

    const pub = await publish("Publish Torrent", draft);

    if (pub) navigate(`/torrents/${nip19.noteEncode(pub.event.id)}`);
  });

  const { getRootProps, getRadioProps } = useRadioGroup({
    name: "category",
    value: getValues().tags.join(","),
    onChange: (v) => setValue("tags", v.split(","), { shouldDirty: true, shouldTouch: true }),
  });

  watch("tags");
  watch("files");
  function renderCategories() {
    return (
      <>
        {torrentCatagories.map((category) => (
          <Box key={category.tag}>
            <Heading size="sm" mt="2" mb="1">
              {category.name}
            </Heading>
            <Flex gap="2" wrap="wrap">
              {renderCategory(category, [category.tag])}
            </Flex>
          </Box>
        ))}
      </>
    );
  }
  function renderCategory(a: Category, tags: Array<string>): ReactNode {
    return (
      <>
        <RadioCard {...getRadioProps({ value: tags.join(",") })}>{a.name}</RadioCard>
        {a.sub_category?.map((b) => renderCategory(b, [...tags, b.tag]))}
      </>
    );
  }

  const descriptionInput = (
    <FormControl isRequired>
      <FormLabel>Description</FormLabel>
      <Textarea
        placeholder="Description"
        rows={smallLayout ? 10 : 25}
        {...register("description", { required: true })}
      />
    </FormControl>
  );

  return (
    <VerticalPageLayout as="form" onSubmit={onSubmit}>
      <Heading size="lg">New Torrent</Heading>

      <ButtonGroup>
        <VisuallyHiddenInput
          type="file"
          accept="application/x-bittorrent"
          ref={torrentFileInput}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) selectTorrentFile(file);
          }}
        />
        <Button onClick={() => torrentFileInput.current?.click()}>Import Torrent file</Button>
      </ButtonGroup>

      <Flex gap="4">
        <Flex gap="2" direction="column" w="full">
          <FormControl isRequired>
            <FormLabel>Title</FormLabel>
            <Input type="text" {...register("title", { required: true })} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Info Hash</FormLabel>
            <Input type="text" {...register("btih", { required: true })} placeholder="hex" />
          </FormControl>
          {smallLayout && descriptionInput}
          <Heading size="md">Category</Heading>
          <Box {...getRootProps()}>{renderCategories()}</Box>
        </Flex>
        {!smallLayout && (
          <Flex gap="2" direction="column" w="full">
            {descriptionInput}
          </Flex>
        )}
      </Flex>
      <Flex direction="column" gap="2">
        {getValues().files.map((file, i) => (
          <Flex gap="2" key={file.name + file.size}>
            <Input
              type="text"
              value={file.name}
              className="flex-1"
              placeholder="collection1/IMG_00001.jpg"
              onChange={(e) =>
                setValue(
                  "files",
                  getValues().files.map((f, ii) => {
                    if (ii === i) {
                      return { ...f, name: e.target.value };
                    }
                    return f;
                  }),
                )
              }
            />
            <NumberInput
              value={file.size}
              min={0}
              onChange={(v) =>
                setValue(
                  "files",
                  getValues().files.map((f, ii) => {
                    if (ii === i) {
                      return { ...f, size: parseInt(v) };
                    }
                    return f;
                  }),
                )
              }
            >
              <NumberInputField />
              <NumberInputStepper>
                <NumberIncrementStepper />
                <NumberDecrementStepper />
              </NumberInputStepper>
            </NumberInput>
            <Button
              flexShrink={0}
              onClick={() =>
                setValue(
                  "files",
                  getValues().files.filter((_, ii) => i !== ii),
                )
              }
            >
              Remove
            </Button>
          </Flex>
        ))}
      </Flex>
      <Flex gap="2" justifyContent="flex-end">
        <Button onClick={() => setValue("files", [...getValues().files, { name: "", size: 0 }])}>Add file info</Button>
        <Button type="submit" isLoading={formState.isSubmitting} colorScheme="primary">
          Publish
        </Button>
      </Flex>
    </VerticalPageLayout>
  );
}
