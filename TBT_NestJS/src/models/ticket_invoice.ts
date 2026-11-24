import { DataTypes, Model, type Sequelize } from "sequelize"
import { TicketInvoiceAttributes, TicketInvoiceItem } from "src/intertfaces/ticket-invoice.interface"

export class TicketInvoice extends Model<TicketInvoiceAttributes> implements TicketInvoiceAttributes {
  declare id: number
  declare ticket_id: number
  declare items?: TicketInvoiceItem[]
  declare extra_notes?: string
  declare subtotal?: number
  declare tax_rate?: number
  declare tax_amount?: number
  declare total?: number
  declare attachments?: any[]
  declare createdAt?: number | Date
  declare updatedAt?: number | Date
}

export const initTicketInvoice = (sequelize: Sequelize): typeof TicketInvoice => {
  TicketInvoice.init(
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      ticket_id: { type: DataTypes.INTEGER, allowNull: false },
      items: { type: DataTypes.JSON },
      extra_notes: { type: DataTypes.TEXT("long") },
      subtotal: { type: DataTypes.DECIMAL(10, 2) },
      tax_rate: { type: DataTypes.DECIMAL(5, 2) },
      tax_amount: { type: DataTypes.DECIMAL(10, 2) },
      total: { type: DataTypes.DECIMAL(10, 2) },
      attachments: { type: DataTypes.JSON },
    },
    {
      sequelize,
      tableName: "ticket_invoices",
      timestamps: true,
    },
  )

  return TicketInvoice
}
