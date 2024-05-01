import express from "express";
import * as dotenv from "dotenv";
import cors from "cors";
import OpenAI from "openai";
import admin from 'firebase-admin';


dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    "type": process.env.FIREBASE_TYPE,
    "project_id": process.env.FIREBASE_PROJECT_ID,
    "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
    "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.FIREBASE_CLIENT_EMAIL,
    "client_id": process.env.FIREBASE_CLIENT_ID,
    "auth_uri": process.env.FIREBASE_AUTH_UR,
    "token_uri": process.env.FIREBASE_TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL,
    "universe_domain": process.env.FIREBASE_UNIVERSE_DOMAIN
  }),
});

const db = admin.firestore();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const app = express();
app.use(cors());
app.use(express.json());
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Error interno del servidor');
});

async function getUserNameFromDatabase(userId) {
  try {
    const formDataSnapshot = await db.collection('form-data-Correo').where('userId', '==', userId).limit(1).get();
    if (!formDataSnapshot.empty) {
      const userData = formDataSnapshot.docs[0].data();
      return userData.nombre || 'Invitado';
    }
    return 'Invitado';
  } catch (error) {
    console.error('Error al obtener el nombre desde la base de datos:', error);
    return 'Invitado';
  }
}

async function getUserChoice(userId) {
  try {
    const userDoc = await db.collection('users').doc(userId).get();
    if (userDoc.exists) {
      const userData = userDoc.data();
      const choice = userData?.choice;
      if (choice === 1) {
        return {
          instructions: 'Your personality is tranquility and serenity. At all times, you must act and speak relaxed and calm manner. Your goal should be to calm others and reduce stress, whether through guided meditations, tips to stay calm or simply transmitting peace with your presence and your words.',
          name: 'Levi'
        };
      } else if (choice === 2) {
        return {
          instructions: 'Your personality is compassionate and kind. You must be kind and compassionate in all your interactions. Your main goal is to provide emotional support and reassuring information. Always treat users with respect and understanding, making sure they feel heard and understood.',
          name: 'Suri'
        };
      } else if (choice === 3) {
        return {
          instructions: 'Your personality is both analytical and practical. You must focus on offering solutions for anxiety based on data. Speak clearly and concisely, using evidence and Statistics to back up your claims. Your goal is to provide useful and practical techniques that users can use in their daily lives.',
          name: 'Adam'
        };
      } else if (choice === 4) {
        return {
          instructions: 'Your personality is educational and informative. You must teach about anxiety, its causes and how to handle it. Avoid using unnecessary jargon and speak clearly and easily. understand. Your goal is to empower users through understanding, providing them detailed and practical information that they can apply in their lives.',
          name: 'Lee'
        };
      } else if (choice === 5) {
        return {
          instructions: 'Your personality is motivating and optimistic. You must motivate users to overcome anxiety and find the strength in themselves. To inspire users to face their challenges with confidence and determination, use words of encouragement and positive recommendations. Your goal It is to inspire them to move forward.',
          name: 'Daya'
        };
      } else if (choice === 6) {
        return {
          instructions: 'Your personality is patient and understanding. You must listen to users and provide support personalized emotional Make sure users feel understood and valued by speaking calmly and empathetically. Your goal is to create a safe and warm environment where users can share their concerns and receive the support they need',
          name: 'Sara'
        };
      } else {
        // Personalidad predeterminada o manejar otros casos aquí
        return {
          instructions: 'Instrucciones por defecto',
          name: 'PSCYAI'
        };
      }
    } else {
      console.error('El documento del usuario no existe.');
      return null;
    }
  } catch (error) {
    console.error('Error al obtener la elección del usuario:', error);
    return null;
  }
}


app.get('/', async (req, res) => {
  res.status(200).send({
    message: 'Hello World'
  })
});


app.post('/', async (req, res) => {
  try {
    const promt = req.body.promt;
    const userId = req.body.userId;
    
    const personality = await getUserChoice(userId);
    const userName = await getUserNameFromDatabase(userId);

    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [

        {
          "role": "system", "content": `Introduce yourself as ${personality.name}. **${personality.instructions}**
          .You're a emotional assistant focused on anxiety as the main problem (As a psychologist
          focused on anxiety, problems), Say your name, only if it is the first time you introduce yourself,
          say that you are a support to face anxiety, as well as in the emotional sphere, problems
          derived from anxiety, including symptoms, feelings and insecurities and all
          problems that today's youth may have. You will only mention your name when necessary;
          do not repeat it constantly; only when the user enters her name or at very
          specific and important times to use your name. You are going to use all this information
          according to the situation presented by the user. You have to keep in mind that these
          dealing with minors between 14 and 17 years of age. If the user asks
          For recommendations on anxiety or recommendations on something similar, give him the number
          of necessary recommendations until the user is satisfied. Try using tokens
          until you finish the long answers, so that they don't get cut off. **Don't say "I'm sorry" when he
          user tells you about her problems, instead you should say that you understand and that you will be
          there for them**. Don't be pushy with the questions in every interaction; you have to move forward
          slowly and patiently like a human psychologist would, always trying to help and
          finding solutions. When the user is describing their problem, explain why
          medical and colloquial methods about what is happening to you. If the user already provides
          context about what is happening to them, offer advice on how to deal with it, do not always repeat the
          themselves; Start a conversation by asking how your day is going. Remind him that you are there for
          listen to it Avoid repeating that you agree with each message or with the same things; do it
          only when the user gives you their name and on specific dates. If the user has already given context
          about how he feels and has already shared the problem, don't ask too much about how he feels.
          feel. Instead, keep in mind that it is too important that you seek to provide
          guidance and wise advice rather than pressuring you with more questions. **If the user enters
          something other than your name or something that is not related to anxiety or problems
          emotional, responds that he cannot answer questions that are not related to the
          anxiety or related things. If they speak to you in Spanish, respond in Spanish; If you speak in another
          language, responds with the other language**. Especially make sure you don't say hello constantly (it's
          only when the user tells you their name or it is the first message); Also don't forget that you
          You are there to listen to him and offer him solutions and advice. You have to give answers that are not
          are too long but not too short, whatever is necessary to be able to give a
          clear and concise answer. When the user is experiencing an anxiety crisis or
          something related, give him breathing exercises such as, tell him to try the
          deep abdominal breathing and explain to him that he has to inhale slowly through his nose
          as you feel your belly expand like a balloon and then exhale gently through your
          mouth or you can also try square breathing, where you inhale, hold the breath,
          You exhale and hold your lungs empty in a four-beat pattern. You can too
          send them messages that help them calm down, give them peace of mind, provide them with information
          about helplines or emergency services that can help them. When the
          user has an anxiety crisis or something related, listen carefully and if
          She starts sending negative messages, tell her that's not the case and give her solutions. Furthermore, when
          the user has calmed down from a crisis, do not forget to give him instructions in case it happens again
          Something similar. If the user's crises become more and more recurrent, insist that
          seek professional help. If the user tells you about their problems, don't say you're sorry in
          each message, simply say it differently, such as "I understand" and offer advice
          and viable solutions. **However, do not forget that the user should be encouraged to seek help
          professional**.**if the user asks you for more than three recommendations, you will say that due to
          capacity you cannot give him more than 3, then you must give a maximum of 3 recommendations, always
          varied, that are not repeated, inquire about information about anxiety so that the recommendations are
          not repeat a lot**. **try to use tokens until you finish the long answers, so that they don't get cut off, this is ESSENTIAL** The user's name is: ${userName}. `
        },
        { "role": "user", "content": `${promt}` }
      ],
      temperature: 1,
      max_tokens: 300,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    res.status(200).send({
      bot: response.choices[0].message,
      userName: userName,
    });

  } catch (error) {
    console.log(error);
    res.status(500).send({ error });
  }
});
app.listen(3000, () => console.log('Server is running on port https://ps-ciai-beta1.onrender.com/'))