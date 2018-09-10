import React from 'react';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import CodeMirror from './CodeMirror';

import css from './XMLEditor.less';

import { getXMLEditMenu } from './getXMLEditMenu';


class XMLEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {};

    this.ref = React.createRef();
  }

  shouldComponentUpdate(nextProps) {

    // TODO: why do we need to prevent updating in the first place?
    return nextProps.xml !== this.props.xml;
  }

  componentDidMount() {
    const {
      editor
    } = this.getCached();

    editor.attachTo(this.ref.current);

    editor.on('change', this.handleChange);

    this.checkImport();
  }

  componentWillUnmount() {
    const {
      editor
    } = this.getCached();

    editor.detach();

    editor.off('change', this.handleChange);
  }

  componentDidUpdate(previousProps) {
    this.checkImport();
  }

  triggerAction(action) {
    const {
      editor
    } = this.getCached();

    if (action === 'undo') {
      editor.doc.undo();
    }

    if (action === 'redo') {
      editor.doc.redo();
    }

    if (action === 'find') {
      editor.execCommand('findPersistent');
    }

    if (action === 'findNext') {
      editor.execCommand('findNext');
    }

    if (action === 'findPrev') {
      editor.execCommand('findPrev');
    }

    if (action === 'replace') {
      editor.execCommand('replace');
    }
  }

  checkImport() {
    const {
      editor
    } = this.getCached();

    const xml = this.props.xml;

    if (xml !== editor.lastXML) {
      editor.setValue(xml);
    }

    editor.refresh();
  }

  handleChange = () => {
    const {
      onChanged
    } = this.props;

    const {
      lastXML
    } = this.state;

    const {
      editor
    } = this.getCached();

    // on initial import, reset history to prevent
    // undo by the user
    if (!lastXML) {
      editor.doc.clearHistory();
    }

    const history = editor.doc.historySize();

    const editMenu = getXMLEditMenu({
      canRedo: !!history.redo,
      canUndo: !!history.undo
    });

    const newState = {
      canExport: false,
      redo: !!history.redo,
      undo: !!history.undo
    };

    if (typeof onChanged === 'function') {
      onChanged({
        ...newState,
        editMenu
      });
    }

    this.setState({
      ...newState,
      lastXML: this.getXML()
    });
  }

  getXML() {
    const {
      editor
    } = this.getCached();

    return editor.getValue();
  }

  render() {
    return (
      <div className={ css.XMLEditor }>
        <div className="content" ref={ this.ref }></div>
      </div>
    );
  }

  static createCachedState() {

    const editor = CodeMirror();

    return {
      editor,
      __destroy: () => {
        editor.destroy();
      }
    };
  }

}

export default WithCache(WithCachedState(XMLEditor));