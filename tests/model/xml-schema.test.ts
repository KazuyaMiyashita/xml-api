import { XMLSchema } from "@/model/xml-schema";

describe("XMLSchema", () => {
  it("should identify void elements", () => {
    const schema = new XMLSchema([
      { name: "br", isVoid: true },
      { name: "div" },
    ]);
    expect(schema.isVoid("br")).toBe(true);
    expect(schema.isVoid("div")).toBe(false);
    expect(schema.isVoid("unknown")).toBe(false);
  });
});
