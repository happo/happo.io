import mergeJsdomOptions from '../src/mergeJSDOMOptions';

const testObj = {};
const defaultObj = {};
const customObj = {};

const defaultOptions = {
  modifyTestObj: obj => { obj.default = 'default'; },
  string: 'default-string',
  nonOverridenString: 'non overriden string',
  obj: defaultObj,
};

const customOptions = {
  modifyTestObj: obj => { obj.custom = 'custom'; },
  string: 'custom-string',
  obj: customObj,
  nullish: null,
};

it('correctly merges 2 jsdom options objects', () => {
  const merged = mergeJsdomOptions(defaultOptions, customOptions);

  merged.modifyTestObj(testObj);

  expect(merged.string).toEqual(customOptions.string);
  expect(merged.nonOverridenString).toEqual(defaultOptions.nonOverridenString);
  expect(testObj.default).toEqual('default');
  expect(testObj.custom).toEqual('custom');
  expect(merged.obj).toEqual(customObj);
  expect(merged.nullish).toEqual(null);
});
