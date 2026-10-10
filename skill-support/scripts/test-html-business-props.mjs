import assert from "node:assert/strict";
import { renderHtmlComponent } from "../../packages/components-html/src/index.js";

const list = renderHtmlComponent("listCard", {
  items: [
    {
      title: "邮件 A",
      description: "说明 A",
      leading: '<span data-slot="leading">L</span>',
      trailing: '<span data-slot="trailing">T</span>',
      actions: '<span data-slot="actions">A</span>'
    },
    { title: "邮件 B", description: "说明 B" }
  ]
});

const attachments = renderHtmlComponent("attachment", {
  items: [
    { type: "PPTX", name: "a.pptx" },
    { type: "DOCX", name: "b.docx" }
  ]
});

const listItemCount = list.split('data-logical-component="List Item/White Surface/Default"').length - 1;
assert.equal(listItemCount, 3, "listCard should include one collection root and two business items");
assert.match(list, /邮件 A/);
assert.match(list, /说明 A/);
assert.match(list, /data-slot="leading">L/);
assert.match(list, /data-slot="trailing">T/);
assert.match(list, /data-slot="actions">A/);

const attachmentItemCount = attachments.split('data-renderer-key="attachment"').length - 1;
assert.equal(attachmentItemCount, 2, "attachment should repeat business items");
assert.match(attachments, /a\.pptx/);
assert.match(attachments, /b\.docx/);

console.log("HTML business props tests passed");
