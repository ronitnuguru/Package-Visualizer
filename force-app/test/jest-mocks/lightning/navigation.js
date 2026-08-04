import { createTestWireAdapter } from "@salesforce/wire-service-jest-util";

export const CurrentPageReference = createTestWireAdapter(jest.fn());
export const mockNavigate = jest.fn();
export const mockGenerateUrl = jest.fn(() => Promise.resolve("/"));

const Navigate = Symbol("Navigate");
const GenerateUrl = Symbol("GenerateUrl");

export const NavigationMixin = (Base) =>
  class extends Base {
    [Navigate](pageReference) {
      mockNavigate(pageReference);
    }

    [GenerateUrl](pageReference) {
      return mockGenerateUrl(pageReference);
    }
  };

NavigationMixin.Navigate = Navigate;
NavigationMixin.GenerateUrl = GenerateUrl;
