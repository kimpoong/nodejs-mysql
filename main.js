var http = require('http');
var url = require('url');
var qs = require('querystring');
var db = require('./lib/db');

var app = http.createServer((req, res) => {
    var queryData = url.parse(req.url, true).query;
    var pathname = url.parse(req.url, true).pathname;
    if (pathname == '/') {
        var id = queryData.id;
        var title;
        var description;
        var name;
        db.query(`
        SELECT topic.id AS id, title, description, name
        FROM topic
        LEFT JOIN author
        ON author_id=author.id`,
        (err, topics) => {
            if (err) throw err;
            var list_html = '<ol>';
            topics.forEach((topic) => {
                if (id == topic.id) {
                    title = topic.title;
                    description = topic.description;
                    name = topic.name
                }
                list_html += `<li><a href="/?id=${topic.id}">${topic.title}</a></li>`;
            });
            list_html += '</ol>';
            var template;
            if (id == undefined) {
                title = 'front page';
                description = 'Welcome!';
                template = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Web-NodeJs:${title}</title>
                        <meta charset="utf-8">
                    </head>
                    <body>
                        <h1><a href="/">Web-NodeJs</a></h1>
                        ${list_html}
                        <p><a href="/create">create</a></p>
                        <h2>${title}</h2>
                        <p>${description}</p>
                    </body>
                </html>
                `;
            }
            else {
                template = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Web-NodeJs:${title}</title>
                        <meta charset="utf-8">
                    </head>
                    <body>
                        <h1><a href="/">Web-NodeJs</a></h1>
                        ${list_html}
                        <p>
                            <a href="/create">create</a>
                            <a href="/update?id=${id}">update</a>
                            <form action="/delete" method="post">
                                <input type="hidden" name="id" value="${id}">
                                <input type="submit" value="delete">
                            </form>
                        </p>
                        <h2>${title}</h2>
                        <p>${description}</p>
                        <h4>by ${name}</h4>
                    </body>
                </html>
                `;
            }
            res.writeHead(200);
            res.end(template);
        });
    }
    else if (pathname == '/create') {
        db.query(`SELECT id, name FROM author`, (err, results) => {
            if (err) throw err;
            var tag = `<select name="author">`;
            results.forEach((result) => {
                tag += `<option value="${result.id}">${result.name}</option>`;
            });
            tag += `</select>`;
            var template = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Web-NodeJs:create</title>
                    <meta charset="utf-8">
                </head>
                <body>
                    <h1><a href="/">Web-NodeJs</a></h1>
                    <form action="/create_doc" method="post">
                        <p><input type="text" name="title" placeholder="title"></p>
                        <p><textarea name="description" placeholder="description"></textarea></p>
                        <p>${tag}</p>
                        <p><input type="submit"></p>
                    </form>
                </body>
            </html>
            `;
            res.writeHead(200);
            res.end(template);
        });
    }
    else if (pathname == '/create_doc') {
        var body = '';
        req.on('data', (data) => {
            body += data;
        });
        req.on('end', () => {
            var post = qs.parse(body);
            db.query(`
            INSERT INTO topic (title, description, created, author_id)
            VALUES (?, ?, NOW(), ?)`, [post.title, post.description, post.author], (err, result) => {
                if (err) throw err;
                res.writeHead(302, { Location: `/?id=${result.insertId}` });
                res.end();
            });
        });
    }
    else if (pathname == '/update') {
        var id = queryData.id;
        db.query(`SELECT title, description, author_id FROM topic WHERE id=?`, [id], (err, topics) => {
            if (err) throw err;
            var topic = topics[0];
            db.query(`SELECT id, name FROM author`, (err, authors) => {
                if (err) throw err;
                var tag = `<select name="author">`;
                authors.forEach((author) => {
                    if (author.id == topic.author_id) tag += `<option value="${author.id}" selected>${author.name}</option>`;
                    else tag += `<option value="${author.id}">${author.name}</option>`;
                });
                tag += `</select>`;
                var template = `
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>Web-NodeJs:update</title>
                        <meta charset="utf-8">
                    </head>
                    <body>
                        <h1><a href="/">Web-NodeJs</a></h1>
                        <form action="/update_doc" method="post">
                            <input type="hidden" name="id" value="${id}">
                            <p><input type="text" name="title" value="${topic.title}"></p>
                            <p><textarea name="description">${topic.description}</textarea></p>
                            <p>${tag}</p>
                            <p><input type="submit"></p>
                        </form>
                    </body>
                </html>
                `;
                res.writeHead(200);
                res.end(template);
            });
        });
    }
    else if (pathname == '/update_doc') {
        var body = '';
        req.on('data', (data) => {
            body += data;
        });
        req.on('end', () => {
            var post = qs.parse(body);
            db.query(`
                UPDATE topic
                SET title=?, description=?, author_id=?
                WHERE id=?`,
            [post.title, post.description, post.author, post.id], (err, result) => {
                if (err) throw err;
                res.writeHead(302, { Location: `/?id=${post.id}` });
                res.end();
            });
        });
    }
    else if (pathname == '/delete') {
        var body = '';
        req.on('data', (data) => {
            body += data;
        });
        req.on('end', () => {
            var post = qs.parse(body);
            db.query(`DELETE FROM topic WHERE id=?`, [post.id], (err, result) => {
                if (err) throw err;
                res.writeHead(302, { Location: '/' });
                res.end();
            });
        });
    }
    else {
        res.writeHead(404);
        res.end('not found');
    }
});

db.connect();
app.listen(3000);