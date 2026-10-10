const PROBES = [
  {
    collection: "Color",
    name: "probe/color",
    type: "COLOR",
    value: { r: 10 / 255, g: 89 / 255, b: 247 / 255, a: 1 },
  },
  {
    collection: "Size & Layout",
    name: "probe/spacing-8",
    type: "FLOAT",
    value: 8,
  },
  {
    collection: "Typography",
    name: "probe/font-family",
    type: "STRING",
    value: "HarmonyOS Sans SC",
  },
];

async function writeProbe() {
  const collections = await pixso.variables.getLocalVariableCollectionsAsync();
  const variables = await pixso.variables.getLocalVariablesAsync();
  const collectionByName = new Map(
    collections.map((collection) => [collection.name, collection]),
  );
  const variableByKey = new Map(
    variables.map((variable) => [
      variable.variableCollectionId + "::" + variable.name,
      variable,
    ]),
  );

  for (const probe of PROBES) {
    const collection = collectionByName.get(probe.collection);
    if (!collection) {
      throw new Error("未找到已有变量集：" + probe.collection);
    }

    const key = collection.id + "::" + probe.name;
    let variable = variableByKey.get(key);
    if (variable && variable.resolvedType !== probe.type) {
      variable.remove();
      variable = undefined;
    }
    if (!variable) {
      variable = pixso.variables.createVariable(
        probe.name,
        collection,
        probe.type,
      );
    }

    variable.description = "Token Gate 最小持久化测试；验证后可清理。";
    for (const mode of collection.modes) {
      variable.setValueForMode(mode.modeId, probe.value);
    }
  }

  pixso.notify("测试完成：已写入 3 个变量，未创建新变量集。");
}

async function cleanProbe() {
  const variables = await pixso.variables.getLocalVariablesAsync();
  let removed = 0;
  for (const variable of variables) {
    if (variable.name.startsWith("probe/")) {
      variable.remove();
      removed += 1;
    }
  }
  pixso.notify("已清理 " + removed + " 个测试变量。");
}

async function main() {
  if (pixso.command === "clean-probe") {
    await cleanProbe();
  } else {
    await writeProbe();
  }
  pixso.closePlugin();
}

main().catch((error) => {
  pixso.notify("Token Probe 失败：" + error.message, { error: true });
  pixso.closePlugin();
});
