/**
 * HireScope — User Repository
 * All queries enforce data-level constraints (unique email).
 */

import { UserModel } from "../models/user.model.js";

export class UserRepository {
  async findByEmail(email) {
    return UserModel.findOne({ email: email.toLowerCase().trim() });
  }

  async findById(id) {
    return UserModel.findById(id);
  }

  async create({ email, passwordHash }) {
    const user = new UserModel({ email, passwordHash });
    return user.save();
  }

  async existsByEmail(email) {
    const count = await UserModel.countDocuments({ email: email.toLowerCase().trim() });
    return count > 0;
  }
}

export const userRepository = new UserRepository();
