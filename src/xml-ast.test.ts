import { XMLElement } from './xml-ast';

describe('XMLElement', () => {
  it('should store tagName and attributes', () => {
    const el = new XMLElement('div', { id: 'main', class: 'container' });
    expect(el.tagName).toBe('div');
    expect(el.attr('id')).toBe('main');
    expect(el.attr('class')).toBe('container');
    expect(el.attr('missing')).toBeUndefined();
  });

  it('should concatenate text content', () => {
    // <div>Hello <span>World</span>!</div>
    const span = new XMLElement('span', {}, ['World']);
    const div = new XMLElement('div', {}, ['Hello ', span, '!']);

    expect(div.text()).toBe('Hello World!');
  });

  it('should find descendants by tag name', () => {
    // <root>
    //   <item id="1">A</item>
    //   <group>
    //     <item id="2">B</item>
    //   </group>
    // </root>
    const item1 = new XMLElement('item', { id: '1' }, ['A']);
    const item2 = new XMLElement('item', { id: '2' }, ['B']);
    const group = new XMLElement('group', {}, [item2]);
    const root = new XMLElement('root', {}, [item1, group]);

    const items = root.find('item');
    expect(items.length).toBe(2);
    expect(items).toContain(item1);
    expect(items).toContain(item2);
  });
});
