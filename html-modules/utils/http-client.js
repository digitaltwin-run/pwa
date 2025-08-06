/**
 * HTTP Client
 * A wrapper around the Fetch API with enhanced features
 */

class HttpClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.pendingRequests = new Map();
    this.debug = process.env.NODE_ENV === 'development';
  }

  /**
   * Set default headers for all requests
   * @param {Object} headers - Headers to set
   */
  setDefaultHeaders(headers) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
    return this;
  }

  /**
   * Add a request interceptor
   * @param {Function} interceptor - Function that modifies the request config
   */
  addRequestInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.requestInterceptors.push(interceptor);
    }
    return this;
  }

  /**
   * Add a response interceptor
   * @param {Function} interceptor - Function that processes the response
   */
  addResponseInterceptor(interceptor) {
    if (typeof interceptor === 'function') {
      this.responseInterceptors.push(interceptor);
    }
    return this;
  }

  /**
   * Execute all request interceptors
   * @private
   */
  async _executeRequestInterceptors(config) {
    let currentConfig = { ...config };
    
    for (const interceptor of this.requestInterceptors) {
      try {
        const result = await interceptor(currentConfig);
        if (result) {
          currentConfig = result;
        }
      } catch (error) {
        console.error('[HttpClient] Request interceptor error:', error);
        throw error;
      }
    }
    
    return currentConfig;
  }

  /**
   * Execute all response interceptors
   * @private
   */
  async _executeResponseInterceptors(response, config) {
    let currentResponse = response;
    
    for (const interceptor of this.responseInterceptors) {
      try {
        const result = await interceptor(currentResponse, config);
        if (result) {
          currentResponse = result;
        }
      } catch (error) {
        console.error('[HttpClient] Response interceptor error:', error);
        throw error;
      }
    }
    
    return currentResponse;
  }

  /**
   * Create a request ID for tracking
   * @private
   */
  _createRequestId(method, url) {
    return `${method.toUpperCase()}:${url}`;
  }

  /**
   * Cancel a pending request
   * @param {string} requestId - The request ID to cancel
   * @param {string} [reason] - Optional cancellation reason
   */
  cancelRequest(requestId, reason = 'Request cancelled by user') {
    const controller = this.pendingRequests.get(requestId);
    if (controller) {
      controller.abort(reason);
      this.pendingRequests.delete(requestId);
      
      if (this.debug) {
        console.log(`[HttpClient] Cancelled request: ${requestId}`, { reason });
      }
      
      return true;
    }
    return false;
  }

  /**
   * Cancel all pending requests
   * @param {string} [reason] - Optional cancellation reason
   */
  cancelAllRequests(reason = 'All requests cancelled') {
    this.pendingRequests.forEach((controller, requestId) => {
      controller.abort(reason);
      this.pendingRequests.delete(requestId);
    });
    
    if (this.debug) {
      console.log(`[HttpClient] Cancelled all pending requests`, { 
        count: this.pendingRequests.size,
        reason 
      });
    }
    
    return this.pendingRequests.size;
  }

  /**
   * Make an HTTP request
   * @private
   */
  async _request(method, url, data = null, options = {}) {
    const {
      headers = {},
      params = {},
      responseType = 'json',
      timeout = 30000,
      retry = 0,
      retryDelay = 1000,
      cancelToken = null,
      onUploadProgress = null,
      onDownloadProgress = null,
      ...restOptions
    } = options;

    // Create request config
    let config = {
      method: method.toUpperCase(),
      headers: { ...this.defaultHeaders, ...headers },
      signal: null,
      ...restOptions
    };

    // Handle URL parameters
    let requestUrl = this.baseURL ? new URL(url, this.baseURL) : new URL(url, window.location.origin);
    
    // Add query parameters
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          requestUrl.searchParams.append(key, String(value));
        }
      });
    }

    // Handle request data (for POST, PUT, PATCH)
    if (data) {
      if (['GET', 'HEAD'].includes(config.method)) {
        // Append data to URL for GET/HEAD requests
        Object.entries(data).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            requestUrl.searchParams.append(key, String(value));
          }
        });
      } else if (data instanceof FormData || data instanceof URLSearchParams) {
        // For FormData or URLSearchParams, let the browser set the Content-Type header
        config.body = data;
        delete config.headers['Content-Type'];
      } else if (typeof data === 'object') {
        // For objects, stringify as JSON
        config.body = JSON.stringify(data);
      } else {
        // For other types, use as-is
        config.body = data;
      }
    }

    // Create AbortController for request cancellation
    const controller = new AbortController();
    config.signal = controller.signal;

    // Set up timeout
    let timeoutId;
    if (timeout > 0) {
      timeoutId = setTimeout(() => {
        controller.abort(`Timeout of ${timeout}ms exceeded`);
      }, timeout);
    }

    // Create request ID and store the controller
    const requestId = this._createRequestId(method, requestUrl.toString());
    this.pendingRequests.set(requestId, controller);

    // Set up cancellation if cancelToken is provided
    if (cancelToken) {
      cancelToken.promise.then(reason => {
        this.cancelRequest(requestId, reason);
      });
    }

    // Execute request interceptors
    try {
      config = await this._executeRequestInterceptors({
        ...config,
        url: requestUrl.toString(),
        method,
        data,
        params,
        requestId
      });
    } catch (error) {
      clearTimeout(timeoutId);
      this.pendingRequests.delete(requestId);
      throw error;
    }

    // Make the request with retry logic
    let lastError;
    let attempts = 0;
    const maxAttempts = Math.max(0, retry) + 1;

    while (attempts < maxAttempts) {
      attempts++;
      
      try {
        if (this.debug) {
          console.groupCollapsed(`[HttpClient] ${config.method} ${requestUrl} (attempt ${attempts}/${maxAttempts})`);
          console.log('Request config:', config);
        }

        const response = await fetch(requestUrl.toString(), config);
        
        // Handle response progress if needed
        if (onDownloadProgress && response.body) {
          const contentLength = response.headers.get('content-length');
          let loaded = 0;
          
          const reader = response.body.getReader();
          const stream = new ReadableStream({
            start(controller) {
              function push() {
                reader.read().then(({ done, value }) => {
                  if (done) {
                    controller.close();
                    return;
                  }
                  
                  loaded += value.length;
                  const total = parseInt(contentLength, 10) || 0;
                  const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
                  
                  if (typeof onDownloadProgress === 'function') {
                    onDownloadProgress({
                      loaded,
                      total,
                      percent,
                      lengthComputable: total > 0
                    });
                  }
                  
                  controller.enqueue(value);
                  push();
                }).catch(error => {
                  controller.error(error);
                });
              }
              
              push();
            }
          });
          
          // Create a new response with the progress-enabled stream
          const newResponse = new Response(stream, {
            headers: response.headers,
            status: response.status,
            statusText: response.statusText
          });
          
          // Execute response interceptors
          const processedResponse = await this._executeResponseInterceptors(newResponse, config);
          
          // Parse the response based on responseType
          let responseData;
          if (responseType === 'json') {
            try {
              responseData = await processedResponse.json();
            } catch (error) {
              // If JSON parsing fails but response is ok, return the text
              if (processedResponse.ok) {
                responseData = await processedResponse.text();
              } else {
                throw error;
              }
            }
          } else if (responseType === 'blob') {
            responseData = await processedResponse.blob();
          } else if (responseType === 'arraybuffer') {
            responseData = await processedResponse.arrayBuffer();
          } else if (responseType === 'formdata') {
            responseData = await processedResponse.formData();
          } else {
            responseData = await processedResponse.text();
          }
          
          clearTimeout(timeoutId);
          this.pendingRequests.delete(requestId);
          
          if (this.debug) {
            console.log('Response:', {
              status: processedResponse.status,
              statusText: processedResponse.statusText,
              headers: Object.fromEntries(processedResponse.headers.entries()),
              data: responseData
            });
            console.groupEnd();
          }
          
          if (!processedResponse.ok) {
            const error = new Error(processedResponse.statusText || 'Request failed');
            error.response = {
              status: processedResponse.status,
              statusText: processedResponse.statusText,
              headers: processedResponse.headers,
              data: responseData
            };
            error.config = config;
            throw error;
          }
          
          return responseData;
        }
        
        // For non-streaming responses
        let responseData;
        if (responseType === 'json') {
          try {
            responseData = await response.json();
          } catch (error) {
            // If JSON parsing fails but response is ok, return the text
            if (response.ok) {
              responseData = await response.text();
            } else {
              throw error;
            }
          }
        } else if (responseType === 'blob') {
          responseData = await response.blob();
        } else if (responseType === 'arraybuffer') {
          responseData = await response.arrayBuffer();
        } else if (responseType === 'formdata') {
          responseData = await response.formData();
        } else {
          responseData = await response.text();
        }
        
        clearTimeout(timeoutId);
        this.pendingRequests.delete(requestId);
        
        if (this.debug) {
          console.log('Response:', {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData
          });
          console.groupEnd();
        }
        
        if (!response.ok) {
          const error = new Error(response.statusText || 'Request failed');
          error.response = {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            data: responseData
          };
          error.config = config;
          throw error;
        }
        
        return responseData;
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(requestId);
        
        if (error.name === 'AbortError') {
          if (this.debug) {
            console.warn(`[HttpClient] Request aborted: ${requestUrl}`, error);
            console.groupEnd();
          }
          throw error;
        }
        
        lastError = error;
        
        if (this.debug) {
          console.error(`[HttpClient] Request failed (attempt ${attempts}/${maxAttempts}):`, error);
          console.groupEnd();
        }
        
        // Don't retry for these status codes
        const nonRetryableStatuses = [400, 401, 403, 404, 405, 422];
        if (error.response && nonRetryableStatuses.includes(error.response.status)) {
          break;
        }
        
        // Wait before retrying
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempts));
        }
      }
    }
    
    // If we get here, all retry attempts failed
    throw lastError || new Error('Request failed with unknown error');
  }

  /**
   * Create a cancel token
   * @returns {{promise: Promise, cancel: Function}} A cancel token object
   */
  createCancelToken() {
    let cancel;
    const promise = new Promise(resolve => {
      cancel = (reason = 'Operation cancelled by the user') => {
        resolve(reason);
      };
    });
    
    return { promise, cancel };
  }

  /**
   * Make a GET request
   * @param {string} url - The URL to request
   * @param {Object} [options] - Request options
   * @returns {Promise} A promise that resolves with the response data
   */
  get(url, options = {}) {
    return this._request('GET', url, null, options);
  }

  /**
   * Make a POST request
   * @param {string} url - The URL to request
   * @param {*} data - The data to send
   * @param {Object} [options] - Request options
   * @returns {Promise} A promise that resolves with the response data
   */
  post(url, data, options = {}) {
    return this._request('POST', url, data, options);
  }

  /**
   * Make a PUT request
   * @param {string} url - The URL to request
   * @param {*} data - The data to send
   * @param {Object} [options] - Request options
   * @returns {Promise} A promise that resolves with the response data
   */
  put(url, data, options = {}) {
    return this._request('PUT', url, data, options);
  }

  /**
   * Make a PATCH request
   * @param {string} url - The URL to request
   * @param {*} data - The data to send
   * @param {Object} [options] - Request options
   * @returns {Promise} A promise that resolves with the response data
   */
  patch(url, data, options = {}) {
    return this._request('PATCH', url, data, options);
  }

  /**
   * Make a DELETE request
   * @param {string} url - The URL to request
   * @param {Object} [options] - Request options
   * @returns {Promise} A promise that resolves with the response data
   */
  delete(url, options = {}) {
    return this._request('DELETE', url, null, options);
  }

  /**
   * Make a HEAD request
   * @param {string} url - The URL to request
   * @param {Object} [options] - Request options
   * @returns {Promise} A promise that resolves with the response headers
   */
  head(url, options = {}) {
    return this._request('HEAD', url, null, { ...options, responseType: 'text' });
  }

  /**
   * Make an OPTIONS request
   * @param {string} url - The URL to request
   * @param {Object} [options] - Request options
   * @returns {Promise} A promise that resolves with the response data
   */
  options(url, options = {}) {
    return this._request('OPTIONS', url, null, options);
  }
}

// Create and export a singleton instance
const httpClient = new HttpClient(process.env.API_BASE_URL || '');

// For debugging
if (typeof window !== 'undefined') {
  window.httpClient = httpClient;
}

export default httpClient;
