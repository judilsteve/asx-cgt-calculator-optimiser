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

export const saveFailedState = new SharedState(false);

const unloadWarning = e => {
    const msg = 'WARNING: Changes could not be saved to your browser\'s local storage. ' +
        'Click "cancel" and export your holdings using the buttons at the top of the page or you WILL lose your work.';
    (e || window.event).returnValue = msg; // Gecko + IE
    return msg; // Gecko + Webkit, Safari, Chrome etc.
}
let unloadWarningSet = false;

saveFailedState.watch(failed => {
    if(failed && !unloadWarningSet) {
        window.addEventListener('beforeunload', unloadWarning);
        unloadWarningSet = true;
    } else if(!failed && unloadWarningSet) {
        clearUnloadWarning();
    }
})

export function clearUnloadWarning() {
    window.removeEventListener('beforeunload', unloadWarning);
    unloadWarningSet = false;
}

export function notifySaveFailed() {
    saveFailedState.setValue(true);
}

export function notifySaveSucceeded() {
    saveFailedState.setValue(false);
}

export class SharedPersistedState extends SharedState {
    constructor(localStorageKey, initialValue) {
        const persistedJson = window.localStorage.getItem(localStorageKey);
        const persistedData = persistedJson === null ? initialValue : JSON.parse(persistedJson);
        super(persistedData);
        // https://developer.mozilla.org/en-US/docs/Web/API/Storage/setItem#exceptions
        this.watch(s => {
            try {
                window.localStorage.setItem(localStorageKey, JSON.stringify(s));
                notifySaveSucceeded();
            } catch(e) {
                console.error('Saving to local storage failed:');
                console.error(e);
                notifySaveFailed();
            }
        });
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