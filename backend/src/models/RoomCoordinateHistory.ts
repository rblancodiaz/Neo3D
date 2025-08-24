import { Model, DataTypes, Sequelize, Association } from 'sequelize';
import {
  RoomCoordinateHistoryAttributes,
  RoomCoordinateHistoryCreationAttributes,
} from '../types/database';
import Room from './Room';

class RoomCoordinateHistory
  extends Model<RoomCoordinateHistoryAttributes, RoomCoordinateHistoryCreationAttributes>
  implements RoomCoordinateHistoryAttributes
{
  public id!: string;
  public roomId!: string;
  public oldXCoordinate!: number | null;
  public oldYCoordinate!: number | null;
  public oldWidth!: number | null;
  public oldHeight!: number | null;
  public newXCoordinate!: number | null;
  public newYCoordinate!: number | null;
  public newWidth!: number | null;
  public newHeight!: number | null;
  public changeReason!: string | null;
  public changedAt!: Date;
  public changedBy!: string | null;

  // Associations
  public readonly room?: Room;

  public static associations: {
    room: Association<RoomCoordinateHistory, Room>;
  };
}

export const initRoomCoordinateHistory = (sequelize: Sequelize): typeof RoomCoordinateHistory => {
  RoomCoordinateHistory.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      roomId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'room_id',
        references: {
          model: 'rooms',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      oldXCoordinate: {
        type: DataTypes.DECIMAL(12, 10),
        allowNull: true,
        field: 'old_x_coordinate',
      },
      oldYCoordinate: {
        type: DataTypes.DECIMAL(12, 10),
        allowNull: true,
        field: 'old_y_coordinate',
      },
      oldWidth: {
        type: DataTypes.DECIMAL(12, 10),
        allowNull: true,
        field: 'old_width',
      },
      oldHeight: {
        type: DataTypes.DECIMAL(12, 10),
        allowNull: true,
        field: 'old_height',
      },
      newXCoordinate: {
        type: DataTypes.DECIMAL(12, 10),
        allowNull: true,
        field: 'new_x_coordinate',
      },
      newYCoordinate: {
        type: DataTypes.DECIMAL(12, 10),
        allowNull: true,
        field: 'new_y_coordinate',
      },
      newWidth: {
        type: DataTypes.DECIMAL(12, 10),
        allowNull: true,
        field: 'new_width',
      },
      newHeight: {
        type: DataTypes.DECIMAL(12, 10),
        allowNull: true,
        field: 'new_height',
      },
      changeReason: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: 'change_reason',
      },
      changedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        field: 'changed_at',
      },
      changedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'changed_by',
      },
    },
    {
      sequelize,
      modelName: 'RoomCoordinateHistory',
      tableName: 'room_coordinate_history',
      timestamps: false,
    },
  );

  return RoomCoordinateHistory;
};

export default RoomCoordinateHistory;