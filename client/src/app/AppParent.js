import React, { Component } from 'react';

import debug from 'debug';

import App from './App';


const log = debug('AppParent');


export default class AppParent extends Component {

  constructor() {
    super();

    this.appRef = React.createRef();
  }

  triggerAction = (event, action, options) => {
    log('trigger action', action, options);

    const {
      backend
    } = this.props.globals;

    const result = this.getApp().triggerAction(action, options);

    if (action === 'quit') {
      Promise.resolve(result).then(
        backend.sendQuitAllowed,
        backend.sendQuitAborted
      );
    }

    if (result && 'catch' in result) {
      result.catch(() => console.error);
    }
  }

  openFiles = (event, files) => {
    log('open files', files);

    this.getApp().openFiles(files);
  }

  handleContextMenu = (type, options) => {
    this.getBackend().showContextMenu(type, options);
  }

  handleReady = () => {

    this.getBackend().sendReady();

    setTimeout(() => {
      const app = this.getApp();

      app.createDiagram('bpmn');
      app.createDiagram('bpmn');
      app.createDiagram('dmn');
      app.createDiagram('dmn', { table: true });
      app.createDiagram('cmmn');
    }, 0);

  }

  getApp() {
    return this.appRef.current;
  }

  getBackend() {
    return this.props.globals.backend;
  }

  componentDidMount() {

    const backend = this.getBackend();

    backend.on('menu:action', this.triggerAction);

    backend.on('client:open-files', this.openFiles);

    backend.once('client:started', () => {
      document.body.classList.remove('loading');
    });
  }

  componentWillUnmount() {

    const {
      globals
    } = this.props;

    const {
      backend
    } = globals;

    backend.off('menu:action', this.triggerAction);

    backend.off('client:open-files', this.openFiles);
  }

  render() {
    const {
      tabsProvider,
      globals
    } = this.props;

    return (
      <App
        ref={ this.appRef }
        tabsProvider={ tabsProvider }
        globals={ globals }
        onContextMenu={ this.handleContextMenu }
        onReady={ this.handleReady }
      />
    );
  }

}