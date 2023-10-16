import cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import camelcase from "camelcase";
import * as prettier from "prettier";

const prettierConfig = JSON.parse(await fs.readFile(".prettierrc", { encoding: "utf-8" }));

const iconsSrc = "./src/components/icons/svg/untitledui-icons";
const iconsDist = "./src/components/icons";
const iconsList = await fs.readdir(iconsSrc);

for (const filename of iconsList) {
  const content = await fs.readFile(path.join(iconsSrc, filename), { encoding: "utf-8" });
  const componentName = camelcase(path.basename(filename, ".svg"), { pascalCase: true });

  const $ = cheerio.load(content);

  const viewBox = $("svg").attr("viewBox");
  const pathElements = $("path");
  const paths = [];
  for (const path of pathElements) {
    // convert all attributes to camelcase
    for (const [key, value] of Object.entries(path.attribs)) {
      const ccKey = camelcase(key);
      if (ccKey !== key) {
        delete path.attribs[key];
        path.attribs[ccKey] = value;
      }
    }

    if (path.attribs["stroke"]) {
      path.attribs["stroke"] = "currentColor";
    }
    if (path.attribs["fill"]) {
      path.attribs["fill"] = "currentColor";
    } else path.attribs["fill"] = "none";

    paths.push($.html(path));
  }

  const outputCode = await prettier.format(
    `
import { createIcon } from "@chakra-ui/icons";

const ${componentName} = createIcon({
	displayName: "${componentName}",
	viewBox: "${viewBox}",
	path: [
		${paths.join(",\n")}
	],
  defaultProps: { boxSize: 4 },
});

export default ${componentName};
	`,
    { ...prettierConfig, parser: "typescript" },
  );

  const outputPath = path.join(iconsDist, filename.replace(".svg", ".tsx"));
  fs.writeFile(outputPath, outputCode, { encoding: "utf-8" });
  console.log(`Wrote ${outputPath}`);
}
