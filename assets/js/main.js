(function () {
	// eslint-disable-next-line no-undef
	const worker = typeof node === 'undefined' ? 'http://127.0.0.1:8787' : node;
	const inputEmailRegex =
		// eslint-disable-next-line no-useless-escape
		/^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

	const timeoutError = 'Unable to submit, request timeout. Try Again';
	const internalError = 'Something went wrong, please try again after sometime';
	const messageSent =
		"<b>Thank you!</b><br><br> We've received your message and will get back to you within 24 hours";

	/**
	 * Disable Submit
	 * Add processing spinner
	 * @param {boolean} status
	 */
	const buttonProcessor = (status = false) => {
		const mailman = document.getElementById('mailman');
		const spinner = mailman.getElementsByTagName('span')[1];
		if (status) {
			mailman.disabled = true;
			spinner.classList.remove('d-none');
		} else {
			mailman.disabled = false;
			spinner.classList.add('d-none');
		}
	};

	const textArea = document.getElementById('message');
	if (textArea !== null) {
		textArea.addEventListener('keyup', function () {
			document.getElementById('txt-count').innerHTML = this.value.length;
		});
	}

	const successCol = document.getElementById('alert-success-col');
	const successTxt = document.getElementById('alert-success-txt');
	const failCol = document.getElementById('alert-danger-col');
	const failTxt = document.getElementById('alert-danger-txt');

	const clearAlertDiv = () => {
		successCol.classList.add('d-none');
		successTxt.innerHTML = '';
		failCol.classList.add('d-none');
		failTxt.innerHTML = '';
	};

	const danger = message => {
		clearAlertDiv();
		failCol.classList.remove('d-none');
		failTxt.innerHTML = message;
	};

	const success = message => {
		clearAlertDiv();
		successCol.classList.remove('d-none');
		successTxt.innerHTML = message;
	};

	async function fetchWithTimeout(resource, options = {}) {
		const { timeout = 8000 } = options;

		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), timeout);
		const response = await fetch(resource, {
			...options,
			signal: controller.signal,
		});
		clearTimeout(id);
		return response;
	}

	const form = document.forms[0];
	if (form) {
		form.addEventListener(
			'submit',
			function (event) {
				event.preventDefault();
				clearAlertDiv();
				if (!form.checkValidity()) {
					event.stopPropagation();
				} else {
					const formData = new FormData(this);
					const entries = formData.entries();
					const data = Object.fromEntries(entries);

					// Check for valid email field
					if (!inputEmailRegex.test(data.eml)) {
						return danger('Please enter a valid email address');
					}

					// reCaptcha
					// eslint-disable-next-line no-undef
					if (grecaptcha.getResponse() === '') {
						return danger('Please complete captcha');
					}

					// Honeypot
					if (data.eml2 !== '') {
						return danger('Form submission not allowed');
					}

					(async function () {
						try {
							// eslint-disable-next-line no-undef
							grecaptcha.reset();
							buttonProcessor(true);
							const response = await fetchWithTimeout(worker, {
								timeout: 15000,
								method: 'POST',
								headers: {
									'content-type': 'application/json',
								},
								body: JSON.stringify(data),
							});
							const postman = await response.json();
							console.log(response.status, response.statusText);
							console.log(JSON.stringify(postman));
							console.log(postman);
							console.log(postman.message);

							if (response.status === 200) {
								form.classList.add('d-none');
								success(messageSent);
							} else if (response.status === 400) {
								danger(postman.message);
							} else {
								danger(internalError);
							}
						} catch (error) {
							// Timeouts if the request takes
							// longer than 6 seconds
							console.log(
								error.name === 'AbortError',
								error.name,
								error.message
							);
							danger(
								error.name === 'AbortError' ? timeoutError : internalError
							);
						}
						return buttonProcessor(false);
					})();
				}
				return form.classList.add('was-validated');
			},
			false
		);
	}
	// eslint-disable-next-line spaced-comment
	//removeIf(production)

	const { title } = document;
	const metaDis = document.querySelector('meta[name="description"][content]');

	if (title) {
		console.warn(`Title: ${title} => ${title.length}`);
	}

	if (metaDis) {
		console.warn(`MetaDis: ${metaDis.content} => ${metaDis.content.length}`);
	}

	const ahref = document.getElementsByTagName('a');
	// eslint-disable-next-line no-plusplus
	for (let i = 0; i < ahref.length; i++) {
		const url = ahref[i].href;
		const href = ahref[i].getAttribute('href');

		if (href === '#' || !href) {
			if (ahref[i].classList.contains('social')) {
				console.log();
			} else if (ahref[i].classList.contains('nav-link')) {
				console.log();
			} else if (ahref[i].classList.contains('w-tab-link')) {
				console.log();
			} else {
				console.error(ahref[i]);
				console.error(`BLANK: ${url} => Tag: ${ahref[i]}`);
			}
		} else {
			const domain = new URL(url);
			if (domain.hostname === '127.0.0.1' || domain.hostname === 'localhost') {
				fetch(url).then(response => {
					if (response.status === 200) {
						console.log(`URL: ${url} => Response: ${response.status}`);
					} else {
						console.error(`Tag:  URL: ${url} => Response: ${response.status}`);
					}
				});
			}
		}
	}
	// eslint-disable-next-line spaced-comment
	//endRemoveIf(production)
})();
