const dotenv = require('dotenv');
const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2/promise');
const app = express();
const port = 3000;

const {
  S3
} = require("@aws-sdk/client-s3");
const multerS3 = require('multer-s3');
dotenv.config();

const s3 = new S3({
  credentials: {
    accessKeyId: process.env.Access_key_ID,
    secretAccessKey: process.env.Secret_access_key,
  },
  region: 'ap-northeast-2',
});


// MySQL 데이터베이스 연결 설정
const connection = mysql.createPool({
  host: process.env.host,
  user: process.env.user,
  password: process.env.dbpwd,
  database: process.env.database
});

// Multer를 사용하여 이미지 업로드를 위한 설정
/*
const upload = multer({
    storage: multer.diskStorage({
      destination(req, file, done) {
        done(null, __dirname + '/uploads');
      },
      filename(req, file, done) {
        const ext = path.extname(file.originalname);
        done(null, path.basename(file.originalname, ext) + Date.now() + ext);
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 },
});
*/
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'memoreal-bucket',
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      //cb(null, `${req.params.id}/${Date.now()}_${file.originalname}`)
      cb(null, `${Date.now()}_${file.originalname}`)
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

app.get('/images', (req, res) => {
    //console.log(process.env);
    res.sendFile(path.join(__dirname, 'multipart.html'));
  });

// 이미지 업로드를 위한 라우팅 설정
// app.post('/images/:id')
app.post('/images', upload.single('image'), async (req, res, next) => {
  /*
    try {
    //const imageUrl = `/images/${req.file.filename}`;
    const imageUrl = 'http://localhost:3000/' + req.file.path.replace(/\\/g, "/");
    // MySQL 데이터베이스에 이미지 경로 저장
    const [result] = await connection.query('INSERT INTO memorealdb.image(DiaryId, ImageUrl) VALUES (?, ?)', [1, imageUrl]);
    console.log(result);
    res.status(200).json({ imageUrl: imageUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
    const { fieldname, originalname, encoding, mimetype, destination, filename, path, size } = req.file
    const { name } = req.body;
    console.log("body 데이터 : ", name);
    console.log("폼에 정의된 필드명 : ", fieldname);
    console.log("사용자가 업로드한 파일 명 : ", originalname);
    console.log("파일의 엔코딩 타입 : ", encoding);
    console.log("파일의 Mime 타입 : ", mimetype);
    console.log("파일이 저장된 폴더 : ", destination);
    console.log("destinatin에 저장된 파일 명 : ", filename);
    console.log("업로드된 파일의 전체 경로 ", path);
    console.log("파일의 바이트(byte 사이즈)", size);
    
    const DiaryId = 1;
    const imageUrl = `/images/${req.file.filename}`;
    const datas = [1, imageUrl];

    
    const sql = "INSERT INTO memorealdb.image(DiaryId, ImageUrl) VALUES (?, ?)";

    connection.query(sql, datas, (err, rows) => {
        if (err) {
            console.error("err : " + err);
        } else {
            console.log("rows : " + JSON.stringify(rows));
            //res.send(rows);
            //res.redirect("/img"+ filename);
            res.status(200).json({imageUrl : imageUrl});

        }
    });

    res.json({ url : ImageUrl });*/
    const imageUrl = req.file.location;

    try{
        const [result] = await connection.query('INSERT INTO memorealdb.image(DiaryId, ImageUrl) VALUES (?, ?)', [1, imageUrl]);
        console.log(result);
        res.status(200).json({ 
          // id : req.params.id,
          imageUrl: imageUrl
        });
        /*
        return res.json({
            success: true,
            image: res.req.file.path,
            fileName: res.req.file.filename,
            type: JSON.parse(res.req.body.type),
            userId: res.req.body.userId,
        });*/
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error });
    }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
