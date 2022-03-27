// this works via webserver and electron!
// TODO: have a look into Fetch API (https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
// which provides a streaming api to save memory
export function get(url: string): Promise<string> {
    return new Promise((succeed, fail) => {
        const req = new XMLHttpRequest()
        req.open('GET', url, true)
        req.addEventListener('load', () => {
            if(req.status < 400){
                succeed(req.responseText)
            }else{
                fail(new Error('Request failed: ' + req.statusText))
            }
        })
        req.addEventListener('error', () => {
            fail(new Error('Network error'))
        })
        req.send(null)
    })
}
