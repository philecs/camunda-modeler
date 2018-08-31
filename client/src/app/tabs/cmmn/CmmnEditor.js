import React from 'react';

import { Fill } from '../../slot-fill';

import {
  Button
} from '../../primitives';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import CamundaCmmnModeler from './modeler';


import css from './CmmnEditor.less';


export class CmmnEditor extends CachedComponent {

  constructor(props) {
    super(props);

    this.state = {};

    this.ref = React.createRef();
    this.propertiesPanelRef = React.createRef();
  }

  componentDidMount() {
    const {
      modeler
    } = this.getCached();

    this.listen('on');

    modeler.attachTo(this.ref.current);

    const propertiesPanel = modeler.get('propertiesPanel');

    propertiesPanel.attachTo(this.propertiesPanelRef.current);

    this.checkImport();
    this.resize();
  }

  componentWillUnmount() {
    const {
      modeler
    } = this.getCached();

    this.listen('off');

    modeler.detach();

    const propertiesPanel = modeler.get('propertiesPanel');

    propertiesPanel.detach();
  }


  listen(fn) {
    const {
      modeler
    } = this.getCached();

    [
      'import.done',
      'saveXML.done',
      'commandStack.changed',
      'selection.changed',
      'attach'
    ].forEach((event) => {
      modeler[fn](event, this.updateState);
    });

    modeler[fn]('error', 1500, this.handleError);
  }

  componentDidUpdate(previousProps) {
    this.checkImport();
  }

  undo = () => {
    const {
      modeler
    } = this.getCached();

    modeler.get('commandStack').undo();
  }

  redo = () => {
    const {
      modeler
    } = this.getCached();

    modeler.get('commandStack').redo();
  }

  align = (type) => {
    const {
      modeler
    } = this.getCached();

    const selection = modeler.get('selection').get();

    modeler.get('alignElements').trigger(selection, type);
  }

  handleError = (event) => {
    const {
      error
    } = event;

    console.warn('modeling error', error);

    // TODO(nikku): handle modeling error
  }

  updateState = (event) => {
    const {
      modeler
    } = this.getCached();

    const {
      onChanged
    } = this.props;

    // TODO(nikku): complete state updating
    const commandStack = modeler.get('commandStack');
    const selection = modeler.get('selection');

    const selectionLength = selection.get().length;

    const newState = {
      undo: commandStack.canUndo(),
      redo: commandStack.canRedo(),
      align: selectionLength > 1,
      setColor: selectionLength
    };

    if (typeof onChanged === 'function') {
      if (this.state.undo !== newState.undo) {
        onChanged(newState.undo);
      }
    }

    this.setState(newState);
  }

  checkImport() {
    const {
      modeler
    } = this.getCached();

    const xml = this.props.xml;

    if (xml !== modeler.lastXML) {

      modeler.lastXML = xml;

      // TODO(nikku): handle errors
      modeler.importXML(xml, function(err) {

      });
    }
  }

  getXML() {
    const {
      modeler
    } = this.getCached();

    return new Promise((resolve, reject) => {

      // TODO(nikku): set current modeler version and name to the diagram

      modeler.saveXML({ format: true }, (err, xml) => {
        modeler.lastXML = xml;

        if (err) {
          return reject(err);
        }

        return resolve(xml);
      });
    });
  }

  triggerAction = (action, context) => {
    const {
      modeler
    } = this.getCached();

    if (action === 'resize') {
      return this.resize();
    }

    // TODO(nikku): handle all editor actions
    modeler.get('editorActions').trigger(action, context);
  }

  saveDiagram = () => {
    const {
      modeler
    } = this.getCached();

    modeler.saveXML((err, result) => {
      console.log(result);
    });
  }

  handleSetColor = (fill, stroke) => {
    this.triggerAction('setColor', {
      fill,
      stroke
    });
  }

  handleContextMenu = (event) => {

    const {
      onContextMenu
    } = this.props;

    if (typeof onContextMenu === 'function') {
      onContextMenu(event);
    }
  }

  resize = () => {
    const {
      modeler
    } = this.getCached();

    const canvas = modeler.get('canvas');

    canvas.resized();
  }

  render() {
    return (
      <div className={ css.CmmnEditor }>

        <Fill name="toolbar" group="commandstack">
          <Button disabled={ !this.state.undo } onClick={ this.undo }>Undo</Button>
          <Button disabled={ !this.state.redo } onClick={ this.redo }>Redo</Button>
        </Fill>

        <Fill name="toolbar" group="image-export">
          <Button onClick={ () => console.log('Export Image') }>Export Image</Button>
        </Fill>

        <Fill name="toolbar" group="align">
          <Button disabled={ !this.state.align } onClick={ () => this.align('left') }>Align Left</Button>
        </Fill>

        <div
          className="diagram"
          ref={ this.ref }
          onFocus={ this.updateState }
          onContextMenu={ this.handleContextMenu }
        ></div>

        <div className="properties">
          <div className="toggle">Properties Panel</div>
          <div className="resize-handle"></div>
          <div className="properties-container" ref={ this.propertiesPanelRef }></div>
        </div>
      </div>
    );
  }

  static createCachedState() {

    // TODO(nikku): wire element template loading
    const modeler = new CamundaCmmnModeler({
      position: 'absolute'
    });

    return {
      modeler,
      __destroy: () => {
        modeler.destroy();
      }
    };
  }

}


export default WithCache(WithCachedState(CmmnEditor));