import { z } from "zod"
import { MAX_QUANTITY_PER_ITEM } from "../shipping"
import { phoneRule } from "./profile"
import { ORDER_STATUSES } from "../order-status"

const line = z.object({
  productId: z.string().min(1).max(36),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(MAX_QUANTITY_PER_ITEM, `At most ${MAX_QUANTITY_PER_ITEM} per item`),
})

export const quoteSchema = z.object({
  items: z.array(line).max(20, "Too many different items in the bag"),
})

export const createOrderSchema = z.object({
  items: z.array(line).min(1, "Your bag is empty").max(20, "Too many different items in the bag"),
  phone: phoneRule.refine((v) => v !== "", "Enter a phone number for the courier"),
  note: z.string().trim().max(300, "Note is too long (300 characters max)").optional(),
  paymentMethod: z.literal("bank_transfer"),
})

export const adminOrderUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  trackingNumber: z.string().trim().max(100).optional(),
})

export type CartLineInput = z.infer<typeof line>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
