import { promisify } from 'util';
import { unlink } from 'fs';
import User from '../models/User';

import deleteAccountValidator from '../functions/libs/deleteAccountValidator';

class DeleteAccountController {
  async delete(req, res) {
    try {
      const schema = deleteAccountValidator;

      if (!(await schema.isValid(req.body))) {
        return res.status(400).json({ error: 'Erro na validação' });
      }

      const unlinkDelete = promisify(unlink);

      const user = await User.findOne({ where: { id: req.userId }, include: ['profiles', 'choices', 'locations', 'connections', 'posts'] });

      const { password } = req.body;

      if (user.connections.expire_token.includes(req.headers.authorization)) {
        return res.status(403).json({ error: 'O Usuário não está autenticado!' });
      }

      if (!(await user.checkPassword(password))) {
        return res.status(400).json({ error: 'Senha incorreta' });
      }

      if (user.profiles.filename === 'default_avatar_female.jpg' || user.profiles.filename === 'default_avatar_male.jpg') {
        await user.choices.destroy();
        await user.locations.destroy();
        await user.profiles.destroy();
        await user.connections.destroy();
        await user.posts.destroy();
        await user.destroy();

        return res.status(200).json({ ok: true });
      }

      unlinkDelete(`uploads/${user.profiles.filename}`);

      await user.choices.destroy();
      await user.locations.destroy();
      await user.profiles.destroy();
      await user.connections.destroy();
      await user.posts.destroy();
      await user.destroy();

      return res.status(200).json({ ok: true });
    } catch (error) {
      return res.status(400).json({ error: 'Erro ao encerrar conta' });
    }
  }
}

export default new DeleteAccountController();
