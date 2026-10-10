#!/usr/bin/env node
import assert from "node:assert/strict";
import { validatePageBlueprint } from "./page-blueprint.mjs";

const valid = {
  schemaVersion: 1, id: "mail-workbench", task: "邮箱工作台", user: "邮件处理人员", workObject: "邮件及其会议信息", primaryJob: "找到邮件并完成处理", designRationale: "列表驱动详情，导航保持跨应用稳定",
  pattern: { id: "pattern-b-three-pane" },
  regions: [{ id: "primary-navigation", purpose: "切换应用和文件夹" }, { id: "secondary-list", purpose: "搜索和选择邮件" }, { id: "main-detail", purpose: "阅读和处理邮件" }],
  contentGroups: [{ id: "mail-list", region: "secondary-list", purpose: "邮件列表", order: 0, priority: "primary", dataEntities: ["mail"] }, { id: "mail-detail", region: "main-detail", purpose: "邮件详情", order: 1, priority: "primary", dataEntities: ["mail", "attachment"] }],
  dataEntities: [{ id: "mail", fields: ["subject", "sender"] }, { id: "attachment", fields: ["name", "size"] }],
  interactions: [{ id: "select-mail", sourceGroup: "mail-list", targetGroup: "mail-detail", trigger: "选择邮件行", stateChange: "更新选中邮件和详情", preserves: ["列表滚动位置", "当前筛选"], taskOutcome: "更新详情" }],
  states: [{ id: "selected", kind: "selection", appliesTo: ["mail-list", "mail-detail"] }],
  design: { readingOrder: ["primary-navigation", "secondary-list", "main-detail"], informationPriority: ["邮件列表", "邮件详情"], regionResponsibilities: [{ region: "primary-navigation", responsibility: "应用和文件夹切换" }, { region: "secondary-list", responsibility: "邮件筛选和选择" }, { region: "main-detail", responsibility: "阅读和处理" }], contentDensity: { "primary-navigation": "compact", "secondary-list": "comfortable", "main-detail": "comfortable" }, primaryActionIds: ["select-mail"], secondaryActionIds: [], relationships: [{ from: "mail-list", to: "mail-detail", kind: "selection" }], stateMatrix: [{ stateId: "selected", appliesTo: ["mail-list", "mail-detail"], entryCondition: "用户选择一行邮件", recovery: "保留列表并恢复默认选中项" }] },
  successCriteria: ["能够阅读邮件"], recoveryPaths: ["无结果时显示恢复入口"]
};
assert.deepEqual(validatePageBlueprint(valid, { patternId: "pattern-b-three-pane" }), []);
assert.ok(validatePageBlueprint({ ...valid, contentGroups: [{ ...valid.contentGroups[0], region: "unknown" }] }, { patternId: "pattern-b-three-pane" }).some((item) => item.includes("region")));
assert.ok(validatePageBlueprint({ ...valid, dataEntities: [] }, { patternId: "pattern-b-three-pane" }).length > 0);
console.log("Page blueprint validation tests passed.");
