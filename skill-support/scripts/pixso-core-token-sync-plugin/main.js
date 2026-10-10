function entries(collection, type, values) {
  return values.map(([name, value]) => ({ collection, type, name, value }));
}

const TOKEN_DEFINITIONS = [
  ...entries("Color", "COLOR", [
    ["brand/05", "#0A59F70C"], ["brand/10", "#0A59F719"], ["brand/15", "#0A59F726"],
    ["brand/20", "#0A59F733"], ["brand/30", "#0A59F74D"], ["brand/40", "#0A59F766"],
    ["brand/50", "#0A59F77F"], ["brand/60", "#0A59F799"], ["brand/70", "#0A59F7B2"],
    ["brand/80", "#0A59F7CC"], ["brand/90", "#0A59F7E5"], ["brand/100", "#0A59F7FF"],
    ["neutral-dark/05", "#0000000C"], ["neutral-dark/10", "#00000019"], ["neutral-dark/15", "#00000026"],
    ["neutral-dark/20", "#00000033"], ["neutral-dark/30", "#0000004D"], ["neutral-dark/40", "#00000066"],
    ["neutral-dark/50", "#0000007F"], ["neutral-dark/60", "#00000099"], ["neutral-dark/70", "#000000B2"],
    ["neutral-dark/80", "#000000CC"], ["neutral-dark/90", "#000000E5"], ["neutral-dark/100", "#000000FF"],
    ["neutral-light/05", "#FFFFFF0C"], ["neutral-light/10", "#FFFFFF19"], ["neutral-light/15", "#FFFFFF26"],
    ["neutral-light/20", "#FFFFFF33"], ["neutral-light/30", "#FFFFFF4D"], ["neutral-light/40", "#FFFFFF66"],
    ["neutral-light/50", "#FFFFFF7F"], ["neutral-light/60", "#FFFFFF99"], ["neutral-light/70", "#FFFFFFB2"],
    ["neutral-light/80", "#FFFFFFCC"], ["neutral-light/90", "#FFFFFFE5"], ["neutral-light/100", "#FFFFFFFF"],
    ["function/success/10", "#64BB5C19"], ["function/success/20", "#64BB5C33"], ["function/success/100", "#64BB5CFF"],
    ["function/warning/10", "#ED6F2119"], ["function/warning/20", "#ED6F2133"], ["function/warning/100", "#ED6F21FF"],
    ["function/danger/10", "#E8402619"], ["function/danger/20", "#E8402633"], ["function/danger/100", "#E84026FF"],
    ["multi/01", "#564AF7"], ["multi/02", "#46B1E3"], ["multi/03", "#61CFBE"], ["multi/04", "#A5D61D"],
    ["multi/05", "#AC49F5"], ["multi/06", "#E64566"], ["multi/07", "#F9A01E"], ["multi/08", "#F7CE00"],
    ["multi/09", "#64BB5C"], ["multi/10", "#E84026"], ["multi/11", "#ED6F21"],
  ]),
  ...entries("Spacing", "FLOAT", [
    ["space/0", 0], ["space/1", 2], ["space/2", 4], ["space/3", 8], ["space/4", 12], ["space/5", 16], ["space/6", 24], ["space/7", 32],
  ]),
  ...entries("Size & Layout", "FLOAT", [
    ["size/04", 4], ["size/06", 6], ["size/08", 8], ["size/12", 12],
    ["size/16", 16], ["size/20", 20], ["size/24", 24], ["size/28", 28],
    ["size/32", 32], ["size/36", 36], ["size/40", 40], ["size/44", 44],
    ["size/48", 48], ["size/56", 56], ["size/64", 64], ["size/72", 72], ["size/80", 80],
    ["radius/0", 0], ["radius/04", 4], ["radius/06", 6], ["radius/08", 8],
    ["radius/12", 12], ["radius/16", 16], ["radius/full", 999],
    ["layout/divider/0.5", 0.5],
    ["layout/width/240", 240], ["layout/width/360", 360], ["layout/width/400", 400],
    ["layout/width/480", 480], ["layout/width/640", 640], ["layout/width/800", 800],
    ["layout/width/1100", 1100], ["layout/width/1728", 1728],
    ["layout/height/720", 720], ["layout/height/1152", 1152],
    ["opacity/40", 40],
  ]),
  ...entries("Typography", "STRING", [["font/family/sans", "HarmonyOS Sans SC"]]),
  ...entries("Typography", "FLOAT", [
    ["font/size/10", 10], ["font/size/12", 12], ["font/size/14", 14],
    ["font/size/16", 16], ["font/size/18", 18], ["font/size/20", 20],
    ["font/size/24", 24], ["font/size/30", 30], ["font/size/38", 38],
    ["font/size/48", 48], ["font/size/56", 56],
    ["font/line-height/12", 12], ["font/line-height/14", 14],
    ["font/line-height/16", 16], ["font/line-height/20", 20],
    ["font/line-height/22", 22], ["font/line-height/24", 24],
    ["font/line-height/28", 28], ["font/line-height/36", 36],
    ["font/line-height/44", 44], ["font/line-height/58", 58],
    ["font/line-height/66", 66],
    ["font/weight/400", 400], ["font/weight/500", 500], ["font/weight/700", 700],
    ["font/letter-spacing/0", 0],
  ]),
];

function rgba(hex) {
  const value = hex.slice(1);
  const full = value.length === 6 ? value + "FF" : value;
  return {
    r: parseInt(full.slice(0, 2), 16) / 255,
    g: parseInt(full.slice(2, 4), 16) / 255,
    b: parseInt(full.slice(4, 6), 16) / 255,
    a: parseInt(full.slice(6, 8), 16) / 255,
  };
}

async function sync() {
  const collections = await pixso.variables.getLocalVariableCollectionsAsync();
  const variables = await pixso.variables.getLocalVariablesAsync();
  const collectionByName = new Map(collections.map((item) => [item.name, item]));
  const variableByKey = new Map(variables.map((item) => [item.variableCollectionId + "::" + item.name, item]));
  let created = 0;
  let updated = 0;

  for (const definition of TOKEN_DEFINITIONS) {
    const collection = collectionByName.get(definition.collection);
    if (!collection) throw new Error("缺少变量集：" + definition.collection);
    const key = collection.id + "::" + definition.name;
    let variable = variableByKey.get(key);
    if (variable && variable.resolvedType !== definition.type) {
      variable.remove();
      variable = undefined;
    }
    if (!variable) {
      variable = pixso.variables.createVariable(definition.name, collection, definition.type);
      created += 1;
    } else {
      updated += 1;
    }
    variable.description = "HarmonyOS PC 基础 Token（127）";
    const value = definition.type === "COLOR" ? rgba(definition.value) : definition.value;
    for (const mode of collection.modes) variable.setValueForMode(mode.modeId, value);
  }

  pixso.notify("基础 Token 同步完成：127 个（新增 " + created + "，更新 " + updated + "）");
  pixso.closePlugin();
}

sync().catch((error) => {
  pixso.notify("核心 Token 同步失败：" + error.message, { error: true });
  pixso.closePlugin();
});
