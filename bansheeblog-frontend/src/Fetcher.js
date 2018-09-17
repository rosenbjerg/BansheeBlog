export function Get(url) {
	return fetch(url, {
		credentials: 'same-origin'
	});
}

export function Post(url, body, json = true) {
	const options = {
		credentials: 'same-origin',
		method: 'POST',
		body
	};
	if (json) {
		options.headers = { 'Content-Type': 'application/json' };
		options.body = JSON.stringify(body);
	}
	return fetch(url, options);
}

export function Put(url, body, json = true) {
	const options = {
		credentials: 'same-origin',
		method: 'PUT',
		body
	};
	if (json) {
		options.headers = { 'Content-Type': 'application/json' };
		options.body = JSON.stringify(body);
	}
	return fetch(url, options);
}

export function Delete(url, body, json = true) {
	const options = {
		credentials: 'same-origin',
		method: 'DELETE',
		body
	};
	if (json) {
		options.headers = { 'Content-Type': 'application/json' };
		options.body = JSON.stringify(body);
	}
	return fetch(url, options);
}