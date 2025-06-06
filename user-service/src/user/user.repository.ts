import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { Model, DeleteResult } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IPaginatedUsers } from './user.interface';

@Injectable()
export class UserRepository {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async create(user: CreateUserDto): Promise<UserDocument> {
    return this.userModel.create(user);
  }

  async update(id: string, user: UpdateUserDto): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(id, { $set: user }, { new: true, runValidators: true })
      .exec();
  }

  async delete(id: string): Promise<DeleteResult> {
    return this.userModel.deleteOne({ _id: id });
  }

  async findOne(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).lean().exec();
  }

  async findAll(page = 1, limit = 10): Promise<IPaginatedUsers> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean().exec(),
      this.userModel.countDocuments(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      page,
      limit,
      total,
      totalPages,
    };
  }
}
