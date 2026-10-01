import type {
  UserDto,
  UserDetailsDto,
  GetAllUsersQuery,
  AddUserCommand,
  UpdateUserCommand,
  AdminChangePasswordRequest,
  PagginatedResult,
} from '../models/user.model'

export interface IUserRepository {
  getAll(query?: GetAllUsersQuery): Promise<PagginatedResult<UserDto>>
  getById(id: string): Promise<UserDetailsDto>
  create(command: AddUserCommand): Promise<UserDto>
  update(id: string, command: UpdateUserCommand): Promise<UserDto>
  delete(id: string): Promise<boolean>
  changePassword(id: string, request: AdminChangePasswordRequest): Promise<boolean>
}
