import React, { Component } from 'react';

import { Fill } from '../../slot-fill';

import {
  Button,
  DropdownButton
} from '../../primitives';

import {
  WithCache,
  WithCachedState,
  CachedComponent
} from '../../cached';

import CamundaBpmnModeler from './modeler';


import css from './BpmnEditor.less';

const COLORS = [{
  title: 'White',
  fill: 'white',
  stroke: 'black'
}, {
  title: 'Blue',
  fill: 'rgb(187, 222, 251)',
  stroke: 'rgb(30, 136, 229)'
}, {
  title: 'Orange',
  fill: 'rgb(255, 224, 178)',
  stroke: 'rgb(251, 140, 0)'
}, {
  title: 'Green',
  fill: 'rgb(200, 230, 201)',
  stroke: 'rgb(67, 160, 71)'
}, {
  title: 'Red',
  fill: 'rgb(255, 205, 210)',
  stroke: 'rgb(229, 57, 53)'
}, {
  title: 'Purple',
  fill: 'rgb(225, 190, 231)',
  stroke: 'rgb(142, 36, 170)'
}];


export class BpmnEditor extends CachedComponent {

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

    modeler[fn]('elementTemplates.errors', this.handleElementTemplateErrors);

    modeler[fn]('error', 1500, this.handleError);

    modeler[fn]('minimap.toggle', this.handleMinimapToggle);
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

  handleMinimapToggle = (event) => {
    console.warn('minimap toggle', event.open);

    // TODO(nikku): persist minimap toggle state
  }

  handleElementTemplateErrors = (event) => {
    const {
      errors
    } = event;

    console.warn('element template errors', errors);

    // TODO(nikku): handle element template errors
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
      dirtyChanged
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

    if (typeof dirtyChanged === 'function') {
      if (this.state.undo !== newState.undo) {
        dirtyChanged(newState.undo);
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
      // TODO(nikku): apply default element templates to initial diagram
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

  handleDistributeElements = (type) => {
    this.triggerAction('distributeElements', {
      type
    });
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
      <div className={ css.BpmnEditor }>

        <Fill name="toolbar" group="save">
          <Button onClick={ this.saveDiagram }>Save Diagram</Button>
          <Button onClick={ this.saveDiagram }>Save Diagram As</Button>
        </Fill>

        <Fill name="toolbar" group="command">
          <Button disabled={ !this.state.undo } onClick={ this.undo }>Undo</Button>
          <Button disabled={ !this.state.redo } onClick={ this.redo }>Redo</Button>
        </Fill>

        <Fill name="toolbar" group="image-export">
          <Button onClick={ () => console.log('Export Image') }>Export Image</Button>
        </Fill>

        <Fill name="toolbar" group="color">
          <DropdownButton
            disabled={ !this.state.setColor }
            text="Set Color">
            {
              COLORS.map((color, index) => {
                const { fill, stroke, title } = color;

                return (
                  <Color
                    fill={ fill }
                    key={ index }
                    stroke={ stroke }
                    title={ title }
                    onClick={ () => this.handleSetColor(fill, stroke) } />
                );
              })
            }
          </DropdownButton>
        </Fill>

        <Fill name="toolbar" group="align">
          <Button disabled={ !this.state.align } onClick={ () => this.align('left') }>Align Left</Button>
          <Button disabled={ !this.state.align } onClick={ () => this.align('center') }>Align Center</Button>
          <Button disabled={ !this.state.align } onClick={ () => this.align('right') }>Align Right</Button>
          <Button disabled={ !this.state.align } onClick={ () => this.align('top') }>Align Top</Button>
          <Button disabled={ !this.state.align } onClick={ () => this.align('middle') }>Align Middle</Button>
          <Button disabled={ !this.state.align } onClick={ () => this.align('bottom') }>Align Bottom</Button>
        </Fill>

        <Fill name="toolbar" group="distribute">
          <Button
            disabled={ !this.state.align }
            onClick={ () => this.handleDistributeElements('horizontal') }>Distribute Horizontally</Button>
          <Button
            disabled={ !this.state.align }
            onClick={ () => this.handleDistributeElements('vertical') }>Distribute Vertically</Button>
        </Fill>

        <Fill name="toolbar" group="deploy">
          <Button>Deploy Current Diagram</Button>
          <Button>Configure Deployment Endpoint</Button>
        </Fill>

        <div
          className="diagram"
          ref={ this.ref }
          onFocus={ this.updateState }
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
    const modeler = new CamundaBpmnModeler({
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


export default WithCache(WithCachedState(BpmnEditor));

class Color extends Component {
  render() {
    const {
      fill,
      onClick,
      stroke,
      title,
      ...rest
    } = this.props;

    return (
      <div
        className={ css.Color }
        onClick={ onClick }
        style={ {
          backgroundColor: fill,
          borderColor: stroke
        } }
        title={ title }
        { ...rest }></div>
    );
  }
}