import React, { Component } from 'react';
const _ = {
  identity: require('lodash/identity'),
};

class Item extends Component {
  getItemTypeClass(type) {
    return type != null ? `item--${type}` : '';
  }
  getStanzaTypeClass(type) {
    switch (type) {
      case 'c': return 'stanza--chorus';
      case 'b': return 'stanza--bridge';
      case 'i': return 'stanza--intro';
      case 'o': return 'stanza--outro';
      case 'r': return 'stanza--refrain';
      default:
        if (type != null && type.match(/^v\d+$/)) {
          return 'stanza--verse';
        }
    }
    return '';
  }


  render() {
    const { index, type, title, author, copyright, stanzas, active } = this.props;
    const isActiveItem = index === active.item;
    const className = ['item',
      this.getItemTypeClass(type),
      isActiveItem ? 'item--active' : '',
    ].filter(_.identity).join(' ');
    return (
      <section className={className} data-index={index} key={index}>
        <div className="item__meta">
          {title && <h2 className="item__title">{ title }</h2>}
          {author && <div className="item__author">{author}</div>}
          {copyright && <div className="item__copyright">{copyright}</div>}
        </div>
        <div className="stanzas" data-count={stanzas.length}>
          {stanzas.map(({ lines, type }, index) => {
            const isActiveStanza = isActiveItem && index === active.stanza;
            const className = ['stanza',
              this.getStanzaTypeClass(type),
              isActiveStanza ? 'stanza--active' : '',
            ].filter(_.identity).join(' ');
            return <p className={className} data-index={index} key={index}>
              {lines.map((line, index) => {
                const isActiveLine = isActiveStanza &&
                  index >= active.line && index < active.line + this.props.lineSkipSize;
                const className = ['line',
                  isActiveLine ? 'line--active' : ''
                ].filter(_.identity).join(' ');
                return <span className={className} data-index={index} key={index}>{line}</span>
              })}
            </p>
          })}
        </div>
      </section>
    );
  }
}

export default Item;
