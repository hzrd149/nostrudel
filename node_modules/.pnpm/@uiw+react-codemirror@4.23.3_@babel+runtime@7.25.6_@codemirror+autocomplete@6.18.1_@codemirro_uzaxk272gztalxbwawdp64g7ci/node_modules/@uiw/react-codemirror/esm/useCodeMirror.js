import { useEffect, useState } from 'react';
import { Annotation, EditorState, StateEffect } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { getDefaultExtensions } from './getDefaultExtensions';
import { getStatistics } from './utils';
var External = Annotation.define();
var emptyExtensions = [];
export function useCodeMirror(props) {
  var {
    value,
    selection,
    onChange,
    onStatistics,
    onCreateEditor,
    onUpdate,
    extensions = emptyExtensions,
    autoFocus,
    theme = 'light',
    height = null,
    minHeight = null,
    maxHeight = null,
    width = null,
    minWidth = null,
    maxWidth = null,
    placeholder: placeholderStr = '',
    editable = true,
    readOnly = false,
    indentWithTab: defaultIndentWithTab = true,
    basicSetup: defaultBasicSetup = true,
    root,
    initialState
  } = props;
  var [container, setContainer] = useState();
  var [view, setView] = useState();
  var [state, setState] = useState();
  var defaultThemeOption = EditorView.theme({
    '&': {
      height,
      minHeight,
      maxHeight,
      width,
      minWidth,
      maxWidth
    },
    '& .cm-scroller': {
      height: '100% !important'
    }
  });
  var updateListener = EditorView.updateListener.of(vu => {
    if (vu.docChanged && typeof onChange === 'function' &&
    // Fix echoing of the remote changes:
    // If transaction is market as remote we don't have to call `onChange` handler again
    !vu.transactions.some(tr => tr.annotation(External))) {
      var doc = vu.state.doc;
      var _value = doc.toString();
      onChange(_value, vu);
    }
    onStatistics && onStatistics(getStatistics(vu));
  });
  var defaultExtensions = getDefaultExtensions({
    theme,
    editable,
    readOnly,
    placeholder: placeholderStr,
    indentWithTab: defaultIndentWithTab,
    basicSetup: defaultBasicSetup
  });
  var getExtensions = [updateListener, defaultThemeOption, ...defaultExtensions];
  if (onUpdate && typeof onUpdate === 'function') {
    getExtensions.push(EditorView.updateListener.of(onUpdate));
  }
  getExtensions = getExtensions.concat(extensions);
  useEffect(() => {
    if (container && !state) {
      var config = {
        doc: value,
        selection,
        extensions: getExtensions
      };
      var stateCurrent = initialState ? EditorState.fromJSON(initialState.json, config, initialState.fields) : EditorState.create(config);
      setState(stateCurrent);
      if (!view) {
        var viewCurrent = new EditorView({
          state: stateCurrent,
          parent: container,
          root
        });
        setView(viewCurrent);
        onCreateEditor && onCreateEditor(viewCurrent, stateCurrent);
      }
    }
    return () => {
      if (view) {
        setState(undefined);
        setView(undefined);
      }
    };
  }, [container, state]);
  useEffect(() => setContainer(props.container), [props.container]);
  useEffect(() => () => {
    if (view) {
      view.destroy();
      setView(undefined);
    }
  }, [view]);
  useEffect(() => {
    if (autoFocus && view) {
      view.focus();
    }
  }, [autoFocus, view]);
  useEffect(() => {
    if (view) {
      view.dispatch({
        effects: StateEffect.reconfigure.of(getExtensions)
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, extensions, height, minHeight, maxHeight, width, minWidth, maxWidth, placeholderStr, editable, readOnly, defaultIndentWithTab, defaultBasicSetup, onChange, onUpdate]);
  useEffect(() => {
    if (value === undefined) {
      return;
    }
    var currentValue = view ? view.state.doc.toString() : '';
    if (view && value !== currentValue) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentValue.length,
          insert: value || ''
        },
        annotations: [External.of(true)]
      });
    }
  }, [value, view]);
  return {
    state,
    setState,
    view,
    setView,
    container,
    setContainer
  };
}