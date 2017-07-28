import React, { Component } from 'react';
import Item from './components/item'
import setData from './data/example-set.json';
const _ = {
  identity: require('lodash/identity'),
  isArray: require('lodash/isArray'),
  isPlainObject: require('lodash/isPlainObject'),
  mapKeys: require('lodash/mapKeys'),
  assignIn: require('lodash/assignIn'),
};

const OBJECTS = ['set', 'item', 'stanza', 'line'];

class App extends Component {
  constructor(props) {
    super(props);
    document.addEventListener('keydown', this.onDocumentKeyDown.bind(this));
    this.state = {
      active: {
        item: 0,
        stanza: 0,
        line: 0,
      }
    };
  }

  getSetData() {
    if (this.setData == null) {
      const data = setData;
      this.setData = _.assignIn(data, {
        items: (data.items || []).map(item =>
          _.assignIn(item, {
            stanzas: this.normalizeStanzas(item),
            content: undefined,
          })
        )
      });
    }
    return this.setData;
  }

  // A stanza may be a string or an array of strings. This normalizes it to an array of strings,
  // splitting by newlines.
  _normalizeStanza(lines, type = '') {
    if (typeof lines === 'string') {
      lines = lines.split("\n");
    }
    return { lines, type };
  }

  _normalizeStanzaRef(ref) {
    // normalize '2' to 'v2'
    return ref.toLowerCase().replace(/^\d+$/, 'v$1')
  }

  getItem(index) {
    return this.getSetData().items[index];
  }

  getStanza(itemIndex, stanzaIndex) {
    return this.getItem(itemIndex).stanzas[stanzaIndex];
  }

  getLine(itemIndex, stanzaIndex, lineIndex) {
    return this.getStanza(itemIndex, stanzaIndex).lines[lineIndex];
  }

  getChildCount(object, active = this.state.active) {
    switch (object) {
      case 'set': return this.getSetData().items.length;
      case 'item': return this.getItem(active.item).stanzas.length;
      case 'stanza': return this.getStanza(active.item, active.stanza).lines.length;
    }
  }

  getParentType(childType) {
    return OBJECTS[OBJECTS.indexOf(childType) - 1]
  }

  // Always returns an array of objects: { type = string?, lines = Array of string }
  //
  // Content can be given as
  //  - a string
  //  - an array
  //  - an object, with an optional `order` prop listing keys
  normalizeStanzas(item) {
    const { content } = item;
    let order, sections;
    if (typeof content === 'string') {
      return [ this._normalizeStanza(content) ];
    } else if (_.isPlainObject(content)) {
      sections = _.mapKeys(content, (value, key) => this._normalizeStanzaRef(key))
      if (item.order == null) {
        order = Object.keys(sections);
      } else if (typeof item.order === 'string' ) {
        order = item.order.trim().split(' ')
      } else {
        throw new TypeError(`Invalid type for 'order'`);
      }
      console.log(order, sections)
      return order
        .map(this._normalizeStanzaRef)
        .map(key => this._normalizeStanza(sections[key], key))
        .filter(stanza => stanza.lines != null);
    } else if (_.isArray(content)) {
      return content.map(this._normalizeStanza);
    } else {
      throw new TypeError(
        `Invalid type for content in item ${this.props.index} of${this.props.title}`
      )
    }
  }

  getDescendentObjects(parent) {
    const objects = ['item', 'stanza', 'line'];
    return objects.slice(objects.indexOf(parent)+1);
  }

  goTo(objectType, destination, childDestination, activeState = this.state.active) {
    if (objectType === 'set') return;

    const { skipSize } = this.props;

    const getMaxIndex = (childType) =>
      this.getChildCount(this.getParentType(objectType), activeState) - 1;

    switch (destination) {
      case 'first':
        destination = 0;
        break;
      case 'last':
        const index = getMaxIndex()
        destination = index - (index % skipSize[objectType]);
        break;
      case 'previous':
        destination = activeState[objectType] - skipSize[objectType];
        break;
      case 'next':
        destination = activeState[objectType] + skipSize[objectType];
        break;
      default: // fall through
    }

    if (typeof destination === 'number') {
      if (destination < activeState[objectType]) {
        if (destination < 0) {
          return this.goTo(this.getParentType(objectType), 'previous', null, activeState);
        }
        childDestination = childDestination || 'last';
      }
      if (destination > activeState[objectType]) {
        if (destination > getMaxIndex()) {
          return this.goTo(this.getParentType(objectType), 'next', null, activeState);
        }
        childDestination = childDestination || 'first';
      }

      activeState[objectType] = destination;


      const newState = {
        active: activeState,
        itemChange: (objectType == 'item'),
      }

      this.getDescendentObjects(objectType)
        .forEach(child => this.goTo(
          child,
          childDestination || 'last',
          null,
          activeState
        ));

      this.setState(newState);
    }
  }

  onDocumentKeyDown(ev) {
    switch (ev.key) {
      case "ArrowUp":
        this.goTo('line', 'previous');
        ev.preventDefault();
        break;
      case "ArrowDown":
        this.goTo('line', 'next');
        ev.preventDefault();
        break;
      case "ArrowLeft":
        this.goTo('stanza', 'previous', 'first');
        ev.preventDefault();
        break;
      case "ArrowRight":
        this.goTo('stanza', 'next');
        ev.preventDefault();
        break;
      default: // fall through
    }
  }

  componentDidUpdate(nextProps, nextState) {
    if (this.state.itemChange) {
      this.el.style.marginLeft = `-${window.innerWidth * this.state.active.item}px`;
    }
  }

  render() {
    const { items } = this.getSetData();
    return (
      <main className="App" ref={(el) => this.el = el}>
        {items.map((item, index) => {
          return <Item {...item}
            key={index}
            index={index}
            type={item.type}
            active={this.state.active}
            lineSkipSize={this.props.skipSize.line}
           />
        })}
      </main>
    );
  }
}

App.defaultProps = {
  skipSize: { item: 1, stanza: 1, line: 2 }
};

export default App;
