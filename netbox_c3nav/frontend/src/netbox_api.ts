export class NetBoxApi {
  key: string = null;
  base: string

  constructor(base: string, apiKey?: string) {
    this.base = base;
    if (apiKey) {
      this.key = apiKey;
    }
  }

  make_url(path: string) {
    const url = new URL(path, this.base);
    if (!url.pathname.endsWith('/')) {
      url.pathname += '/';
    }
    return url;
  }

  async req(method:string, path: string, body?: object | Array<any>, content_type?: string, extra_headers?: object) {
    const headers = {
      'Accept': 'application/json',
    }
    if (this.key) {
      headers['Authorization'] = `Token ${this.key}`
    }
    if (body && !content_type) {
      headers['Content-Type'] = 'application/json';
    }
    if (extra_headers) {
      for (const key in extra_headers) {
        headers[key] = extra_headers[key]
      }
    }
    const init: RequestInit = {
      method: method,
      headers: headers
    };
    if (typeof body !== 'undefined') {
      init.body = JSON.stringify(body);
    }
    return await fetch(this.make_url(path), init);
  }

  get(path: string) {
    return this.req('GET', path).then(r => r.json());
  }

  async get_with_etag(path: string, etag: string) {
    const res = await this.req('GET', path, undefined, undefined, {
      'If-None-Match': etag
    });
    const res_etag = res.headers.get('etag');
    if (etag !== null && res_etag === etag) {
      return {
        etag: res_etag,
        data: null,
      };
    }
    return {
      etag: res_etag,
      data: await res.json(),
    };
  }

  post(path: string, data: object | Array<any>) {
    return this.req('POST', path, data).then(r => r.json());
  }

  put(path: string, data : object | Array<any>) {
    return this.req('PUT', path, data).then(r => r.json());
  }
}

export const netBoxApi = new NetBoxApi(`${window.location.origin}/api/`)

export interface ListResponse {
  count: number
  next: string | null
  previous: string | null
  results: Array<any>
}