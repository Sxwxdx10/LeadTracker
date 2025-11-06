import { useState, useCallback, useRef } from 'react';
import { UndoRedoManager, HistoryAction } from '@/utils/undoRedo';

export function useUndoRedo() {
  const managerRef = useRef(new UndoRedoManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateState = useCallback(() => {
    setCanUndo(managerRef.current.canUndo());
    setCanRedo(managerRef.current.canRedo());
  }, []);

  const addAction = useCallback((action: HistoryAction) => {
    managerRef.current.addAction(action);
    updateState();
  }, [updateState]);

  const undo = useCallback(async () => {
    const result = await managerRef.current.undo();
    updateState();
    return result;
  }, [updateState]);

  const redo = useCallback(async () => {
    const result = await managerRef.current.redo();
    updateState();
    return result;
  }, [updateState]);

  const getUndoDescription = useCallback(() => {
    return managerRef.current.getUndoDescription();
  }, []);

  const getRedoDescription = useCallback(() => {
    return managerRef.current.getRedoDescription();
  }, []);

  const clear = useCallback(() => {
    managerRef.current.clear();
    updateState();
  }, [updateState]);

  return {
    canUndo,
    canRedo,
    addAction,
    undo,
    redo,
    getUndoDescription,
    getRedoDescription,
    clear
  };
}

