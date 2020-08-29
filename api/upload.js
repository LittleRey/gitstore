const fs = require('fs');
const request = require('request');
const multiparty = require('multiparty');

module.exports = (req, res) => {

    const up = {
        time: function () {
            return new Date(Date.now().valueOf() + 8 * 3600000).toISOString();
        },
        vm: {
            code: 0,
            msg: null
        }
    };

    try {
        if (req.method === "POST") {
            let form = new multiparty.Form();
            form.parse(req, (err, fields, files) => {

                if (err) {
                    up.vm.msg = err;
                } else {
                    let or = fields.or[0], path, token = fields.token[0], name = fields.name[0], file = files.file[0];

                    if (or && or.length > 2 && or.indexOf('/') > 0) {

                        if (token && token.length > 30) {

                            if (fields.path == null) {
                                let ext = name.split('.').pop();

                                path = new Date(new Date().valueOf() + 8 * 3600000).toISOString()
                                    .replace(/-/g, '/').replace('T', '/').replace(/:/g, '').replace('.', '').replace('Z', '')
                                    + Math.random().toString().substring(3, 4) + '.' + ext;
                            } else {
                                path = fields.path[0];
                            }

                            let uri = "https://api.github.com/repos/" + or + "/contents/" + path;
                            let bitfile = fs.readFileSync(file.path);
                            let content = Buffer.from(bitfile, 'binary').toString('base64');

                            request({
                                url: uri,
                                method: "PUT",
                                json: true,
                                headers: {
                                    'User-Agent': req.headers['user-agent'],
                                    Accept: 'application/vnd.github.v3+json',
                                    Authorization: 'token ' + token
                                },
                                body: {
                                    message: 'up',
                                    content: content
                                }
                            }, function (error, response, body) {
                                if (error) {
                                    up.vm.msg = error + "";
                                } else {
                                    up.vm.code = response.statusCode
                                    up.vm.data = body;
                                }
                                res.json(up.vm);
                            });
                        } else {
                            up.vm.msg = "token Parameter is invalid";
                        }
                    } else {
                        up.vm.msg = "or Parameter is invalid";
                    }
                }
            });
        } else {
            up.vm.msg = "Method not allowed. Send a POST request.";
            res.json(up.vm);
        }
    } catch (e) {
        up.vm.code = -1;
        up.vm.msg = e + "";
        res.json(up.vm);
    }
}