export const UPDATE_CONNECTED_STATE = "connection/UPDATE_CONNECTED_STATE";
export const UPDATE_SHOULD_PROMPT = "connection/UPDATE_SHOULD_PROMPT";
export const UPDATE_REFRESHING = "connection/UPDATE_REFRESHING";

import { getEndpoint, urlPrompt } from "../lib/helpers";

import { updateUrl } from "./url";

export function updateConnectedState(connected) {
    return {
        type: UPDATE_CONNECTED_STATE,
        connected
    };
}

export function updateShouldPrompt() {
    return {
        type: UPDATE_SHOULD_PROMPT
    };
}

export function updateRefreshing(refreshing) {
    return {
        type: UPDATE_REFRESHING,
        refreshing
    };
}

const shouldPrompt = getState => {
    const connection = getState().connection;
    return !connection.connected && !connection.shouldPrompt;
};

const urlPromptHelper = dispatch => {
    urlPrompt(url => {
        dispatch(updateUrl(url));
        dispatch(updateShouldPrompt());
        dispatch(refreshConnectedState());
    }, () => {
        dispatch(updateShouldPrompt());
    });
};

/**
 * refreshConnectedState checks if the query endpoint responds and updates the
 * connected state accordingly
 */
export function refreshConnectedState() {
    return (dispatch, getState) => {
        dispatch(updateRefreshing(true));

        const url = getState().url;
        return fetch(getEndpoint(url, "health"), {
            method: "GET",
            mode: "cors",
            headers: {
                Accept: "application/json"
            }
        })
            .then(response => {
                let nextConnectedState;
                if (response.status === 200) {
                    nextConnectedState = true;
                } else {
                    nextConnectedState = false;
                }

                let sp = false;
                if (!nextConnectedState) {
                    sp = shouldPrompt(getState);
                }

                dispatch(updateConnectedState(nextConnectedState));

                if (sp) {
                    urlPromptHelper(dispatch);
                }
            })
            .catch(e => {
                console.log(e.stack);

                const sp = shouldPrompt(getState);

                dispatch(updateConnectedState(false));

                if (sp) {
                    urlPromptHelper(dispatch);
                }
            });
    };
}
