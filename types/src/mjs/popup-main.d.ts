export namespace tabInfo {
    const tab: any;
}
export function setTabInfo(tab: object): Promise<void>;
export const sns: Map<any, any>;
export function setSnsItems(): Promise<void>;
export namespace contextInfo {
    const isLink: boolean;
    const content: any;
    const selectionText: any;
    const title: any;
    const url: any;
}
export function initContextInfo(): Promise<object>;
export function createShareData(evt: object): Promise<any>;
export function createHtml(): Promise<void>;
export function openOptionsOnClick(): Promise<any>;
export function menuOnClick(evt: object): Promise<any>;
export function addListenerToMenu(): Promise<void>;
export function updateMenu(data: object): Promise<void>;
export function handleMsg(msg: any): Promise<any[]>;
export function toggleWarning(): Promise<void>;
export function toggleSnsItem(id: string, obj?: object): Promise<void>;
export function handleStoredData(data?: object, area?: string): Promise<any[]>;
export function prepareTab(): Promise<any[]>;
