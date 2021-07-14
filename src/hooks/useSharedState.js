import { useEffect, useState } from 'react';

export class SharedState {
    constructor(initialValue) {
        this.value = initialValue;
        this.watchers = [];
    }

    watch(watcher) {
        this.watchers.push(watcher);
        return this.watchers.length - 1;
    }

    removeWatcher(index) {
        this.watchers.splice(index, 1);
    }

    setValue(newValue) {
        this.value = newValue;
        for(const watcher of this.watchers) {
            watcher(newValue);
        }
    }
}

export class SharedPersistedState extends SharedState {
    constructor(localStorageKey, initialValue) {
        const persistedJson = window.localStorage.getItem(localStorageKey);
        const persistedData = persistedJson === null ? initialValue : JSON.parse(persistedJson);
        super(persistedData);
        this.watch(s => window.localStorage.setItem(localStorageKey, JSON.stringify(s)));
    }
}

export function useSharedState(sharedState) {
    const [value, setValue] = useState(sharedState.value);
    useEffect(() => {
        const watcherIndex = sharedState.watch(setValue);
        return () => sharedState.removeWatcher(watcherIndex);
    }, [sharedState]);
    return [value, newValue => sharedState.setValue(newValue)];
}