const dotenv = require('dotenv');
const express = require('express');
const multer = require('multer');
const path = require('path');
const mysql = require('mysql2/promise');
const app = express();
const port = 3000;
const {spawn} = require('child_process');
const fs = require('fs');

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
// 이미지 업로드
const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'memoreal-bucket',
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: function (req, file, cb) {
      //cb(null, `${req.params.id}/${Date.now()}_${file.originalname}`)
      cb(null, `images/${Date.now()}_${file.originalname}`) // 앞에 폴더명 'folder/' 붙이면 폴더로 이동
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// AI ) 1. 이미지 input에 저장하기
const aiupload = multer({
  storage: multer.diskStorage({
    destination(req, file, done) {
      done(null, '/home/ubuntu/memoreal/yolact/input'); // /home/ubuntu/memoreal/yolact/input
    },
    filename(req, file, done) {
      const ext = path.extname(file.originalname);
      done(null, 'ai_' + path.basename(file.originalname, ext) + Date.now() + ext); // ai_filename20230605.jpg
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
});

app.get('/ai', (req, res) => {
  res.sendFile(path.join(__dirname, 'multipart2.html'));
});

/*
// 이미지 업로드를 위한 라우팅 설정
app.post('/ai', aiupload.single('image'), async (req, res, next) => {
  let imageUrl = '';
  
  const directoryPath = 'C:/Users/dywjd/Desktop/nodejs/uploadimage/extracts';  // 업로드할 디렉토리 경로
  let dataToSend;
  let json_ai = '';
  let json_s3 = '';


  // 2. process.py 실행하기
  const python = spawn('python', ['C:/Users/dywjd/Desktop/nodejs/uploadimage/helloworld.py']);

  // stdout의 'data'이벤트리스너로 실행결과를 받음
  python.stdout.on('data', (data) => {
      dataToSend = data.toString();
      console.log('data' + dataToSend);
      json_ai = 'ok';
      console.log(json_ai);
  })

  // 에러 발생 시, stderr의 'data'이벤트리스너로 실행결과를 받음
  python.stderr.on('data', (data) => {
    console.log('error '+ data.toString());
  });

  python.on('close', (code) => {
    //res.send(dataToSend);
    console.log('close');
  })

  console.log(`json_ai ${json_ai}`);
  // 3. output 이미지 S3에 올리고 프론트에 전달
  
  // 업로드할 디렉토리 경로
  //const directoryPath = '/extracts';


  // 디렉토리 내의 파일 업로드
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.log(err);
      throw err;
    }

    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      const key = `extracts/${file}`;

      fs.readFile(filePath, (err, data) => {
        if (err) throw err;

        const params = {
          Bucket: 'memoreal-bucket',
          Key: key,
          Body: data
        };


        s3.putObject(params, (err, data) => {
          if (err) throw err;

          imageUrl = data.Location; // S3에 업로드 된 URL
          console.log(`파일 ${file}이(가) 성공적으로 업로드되었습니다.`, data.Location);
        });
      });
    });
  });
*/
/*

  try{
      const [result] = await connection.query('INSERT INTO memorealdb.image(DiaryId, ImageUrl) VALUES (?, ?)', [1, imageUrl]);
      console.log(result);
      json_s3 = imageUrl;
      
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: error });
  }

  */

/*
  res.status(200).json({
    imageUrl : json_s3,
    ai : json_ai,
    //userID : 
  });
});

*/
app.post('/ai', aiupload.single('image'), async (req, res, next) => {
  let imageUrl = '';
  const directoryPath = '/home/ubuntu/memoreal/yolact/extracts';  // 업로드할 디렉토리 경로
  let json_ai = '';
  let json_s3 = '';

  const uploadFilesToS3 = async () => {
    const files = await fs.promises.readdir(directoryPath);
    const uploadPromises = files.map(file => {
      const filePath = path.join(directoryPath, file);
      const key = `extracts/${Date.now()}${file}`;

      return fs.promises.readFile(filePath)
        .then(data => {
          const params = {
            Bucket: 'memoreal-bucket',
            Key: key,
            Body: data,
		  ACL: 'public-read',
		  ContentType: 'image/png'
          };

          return new Promise((resolve, reject) => {
            s3.putObject(params, (err, data) => {
              if (err) reject(err);
		    //imageUrl = data.location;

              imageUrl = `https://${params.Bucket}.s3.ap-northeast-2.amazonaws.com/${key}`;
		    //console.log(data);

              console.log(`파일 ${file}이(가) 성공적으로 업로드되었습니다.`, imageUrl);
              resolve();
            });
          });
        });
    });

    await Promise.all(uploadPromises);
  };

  const executePythonScript = () => {
    return new Promise((resolve, reject) => {
	    const python = spawn('python3', ['/home/ubuntu/memoreal/yolact/pipeline_cpu.py', '--Category=person']);
	    //const python = spawn('python3', ['/home/ubuntu/Memoreal-Backend/uploadimage/helloworld.py']);

      python.stdout.on('data', (data) => {
        console.log('data', data.toString());
        json_ai = 'ok';
        console.log('json_ai', json_ai);
      });

      python.stderr.on('data', (data) => {
        console.log('error', data.toString());
      });

      python.on('close', (code) => {
        console.log('close');
        resolve();
      });
    });
  };

  const saveImageUrlToDatabase = async (imageUrl) => {
    try {
      const [result] = await connection.query('INSERT INTO datamanage.Image(DiaryId, ImageUrl) VALUES (?, ?)', [1, imageUrl]);
      json_s3 = 'ok';
      console.log(result);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };


  try {
    await executePythonScript();
    await uploadFilesToS3();
	  console.log(`imageUrl: ${imageUrl}`);
    await saveImageUrlToDatabase(imageUrl);

    res.status(200).json({
      imageUrl: imageUrl,
      ai: json_ai,
      tos3: json_s3,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error });
  }
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
        const [result] = await connection.query('INSERT INTO datamanage.Image(DiaryId, ImageUrl) VALUES (?, ?)', [1, imageUrl]);
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
