
		jQuery(function($, undefined) {
            var main = $('body').terminal({
				start: function() {
					this.push(function(data) {
						if (data) {
							this.echo("Verifying existence onchain...");
							this.pause();

							fetch ("/verify", {
								method: 'post',
								headers: {
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({
									'name': data,
								})
							})
							.then(res => {
								(async function () {
									await res.json().then(res => {
										// if name is/isn't recognized
										main.resume();

										if (JSON.parse(res.data)[1]) {

										} else {
											main.echo(`[[b;blue;]"${data}"] is not recognized onchain. Please enter the [[b;blue;]"create"] command to create a new Samaritan`);
											main.pop();
										}
									});
								})();  
							})
						}
					}, {
						prompt: 'What is the name of your Samaritan: ',
						onPop: function(before, after) {
							this.pop();
						},
					});
				},

				create: function() {
					this.push(function(data) {
						if (data) {
							this.echo("Verifying name uniqueness onchain...");
							this.pause();

							fetch ("/verify", {
								method: 'post',
								headers: {
									'Content-Type': 'application/json'
								},
								body: JSON.stringify({
									'name': data,
								})
							})
							.then(res => {
								(async function () {
									await res.json().then(res => {
										// if name is/isn't recognized
										if (JSON.parse(res.data)[1]) {
											main.resume();
											main.echo(`The name [[b;blue;]"${data}"] has been taken by someone else. Kindly select another name :)`);
										} else {
											// attempt to create samaritan
											main.echo("Creating your Samaritan...");
											fetch ("/create", {
												method: 'post',
												headers: {
													'Content-Type': 'application/json'
												},
												body: JSON.stringify({
													"name": data
												})
											})
											.then(res => {
												(async function () {
													await res.json().then(res => {
														main.resume();

														main.echo(`Samaritan created! Technical Details: `);
														main.echo(`Name: [[b;blue;]"${res.data.name}"]`);
														main.echo(`DID: [[b;blue;]"${res.data.did}"]`);
														main.echo(`DID Document IPFS CID: [[b;blue;]"${res.data.doc_cid}"]`);
														main.echo(`Samaritan Keys: [[b;blue;]"${res.data.keys}"] ([[b;red;] You have 30 seconds to copy them.])`);

														main.pause();
														setTimeout(() => {
															main.update(-1, "Samaritan Keys: [[b;blue;]**************************************************************************************]").resume();
															main.pop();
														}, 30000);
													});
												})();  
											})
										}
									});
								})();  
							})
						}
					}, {
						prompt: 'What will you call your Samaritan: ',
						onPop: function(before, after) {
							this.pop();
						},
					});
				},

			}, {
				greetings: function () {
					return greetings.innerHTML
				}, 
                name: 'Samaritan',
				historySize: 10,
                prompt: '[[b;green;]>>> ]',
				onInit: function() {
					
				}
			});
		});