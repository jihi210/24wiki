import {romanize} from 'koroman';

// 값 slug로 쓸 수 있게 다듬어주는 함수
export function toSlug(input: string) {
    return romanize(input)
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0,40)
}

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;