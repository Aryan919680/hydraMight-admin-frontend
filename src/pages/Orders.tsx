import { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  Search,
} from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import {
  AdminOrder,
  AdminOrderDetail,
  AdminOrderEvent,
  AdminOrderSummary,
  api,
} from "@/lib/api";

const money = (value: unknown) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const dateTime = (value?: string | null) => {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

const displayStatus = (value?: string | null) =>
  String(value || "not_started").replace(/_/g, " ");

const getBadgeClass = (value?: string | null) => {
  const current = String(value || "").toLowerCase();

  if (["paid", "approved", "delivered", "completed"].includes(current)) {
    return "border-green-300 bg-green-50 text-green-700";
  }

  if (
    ["cancelled", "rejected", "failed", "returned", "refunded"].includes(
      current
    )
  ) {
    return "border-red-300 bg-red-50 text-red-700";
  }

  if (
    [
      "pending",
      "pending_approval",
      "pending_admin_approval",
      "pending_stockist_approval",
      "processing",
      "placed",
    ].includes(current)
  ) {
    return "border-yellow-300 bg-yellow-50 text-yellow-700";
  }

  return "border-blue-300 bg-blue-50 text-blue-700";
};

export default function Orders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [summary, setSummary] = useState<AdminOrderSummary>({});

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [portalType, setPortalType] = useState("all");
  const [orderStatus, setOrderStatus] = useState("all");

  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [orderDetail, setOrderDetail] = useState<AdminOrderDetail | null>(
    null
  );
  const [timeline, setTimeline] = useState<AdminOrderEvent[]>([]);
  const [note, setNote] = useState("");

  const loadOrders = async () => {
    setLoading(true);

    try {
      const [ordersResponse, summaryResponse] = await Promise.all([
        api.getAdminOrders({
          portal_type: portalType === "all" ? undefined : portalType,
          status: orderStatus === "all" ? undefined : orderStatus,
          search: search.trim() || undefined,
          limit: 200,
          offset: 0,
        }),
        api.getAdminOrderSummary(),
      ]);

      setOrders((ordersResponse.data || []) as AdminOrder[]);
      setSummary((summaryResponse.data || {}) as AdminOrderSummary);
    } catch (error) {
      toast({
        title: "Unable to load orders",
        description:
          error instanceof Error
            ? error.message
            : "Please check backend connection",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portalType, orderStatus]);

  const openOrderDetail = async (order: AdminOrder) => {
    const orderId = String(order.id || order.order_id || "");

    if (!orderId) {
      toast({
        title: "Invalid order ID",
        variant: "destructive",
      });
      return;
    }

    setSelectedOrder(order);
    setOrderDetail(null);
    setTimeline([]);
    setLoadingDetail(true);

    try {
      const [detailResponse, timelineResponse] = await Promise.all([
        api.getAdminOrderDetail(order.portal_type, orderId),
        api.getAdminOrderTimeline(order.portal_type, orderId),
      ]);

      setOrderDetail((detailResponse.data || detailResponse) as AdminOrderDetail);
      setTimeline((timelineResponse.data || []) as AdminOrderEvent[]);
    } catch (error) {
      toast({
        title: "Unable to load order details",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshCurrentDetail = async () => {
    if (!selectedOrder) return;
    await openOrderDetail(selectedOrder);
  };

  const updateStatus = async (
    type: "order" | "payment" | "delivery",
    value: string
  ) => {
    if (!selectedOrder) return;

    const orderId = String(selectedOrder.id || selectedOrder.order_id || "");

    setSaving(true);

    try {
      if (type === "order") {
        await api.updateAdminOrderStatus(
          selectedOrder.portal_type,
          orderId,
          value
        );
      }

      if (type === "payment") {
        await api.updateAdminOrderPaymentStatus(
          selectedOrder.portal_type,
          orderId,
          value
        );
      }

      if (type === "delivery") {
        await api.updateAdminOrderDeliveryStatus(
          selectedOrder.portal_type,
          orderId,
          value
        );
      }

      toast({
        title: "Order updated successfully",
      });

      await loadOrders();
      await refreshCurrentDetail();
    } catch (error) {
      toast({
        title: "Order update failed",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addNote = async () => {
    if (!selectedOrder || !note.trim()) return;

    const orderId = String(selectedOrder.id || selectedOrder.order_id || "");

    setSaving(true);

    try {
      await api.addAdminOrderNote(
        selectedOrder.portal_type,
        orderId,
        note.trim()
      );

      setNote("");

      toast({
        title: "Admin note added",
      });

      await refreshCurrentDetail();
    } catch (error) {
      toast({
        title: "Unable to add note",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return orders;

    return orders.filter((order) => {
      const values = [
        order.order_number,
        order.customer_name,
        order.business_name,
        order.customer_phone,
        order.customer_email,
        order.location_name,
      ];

      return values.some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      );
    });
  }, [orders, search]);

  const orderItems = orderDetail?.items || [];

  return (
    <div>
      <PageHeader
        title="Order Management"
        description="View and manage real orders from household, commercial, distributor and white-label portals."
        actions={
          <Button variant="outline" onClick={loadOrders}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Orders</p>
            <p className="mt-1 text-2xl font-semibold">
              {Number(summary.total_orders || 0).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Household</p>
            <p className="mt-1 text-2xl font-semibold">
              {Number(summary.household_orders || 0).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Commercial</p>
            <p className="mt-1 text-2xl font-semibold">
              {Number(summary.commercial_orders || 0).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Distributor</p>
            <p className="mt-1 text-2xl font-semibold">
              {Number(summary.distributor_orders || 0).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Approval</p>
            <p className="mt-1 text-2xl font-semibold">
              {Number(summary.pending_approval || 0).toLocaleString("en-IN")}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>All Portal Orders</CardTitle>

          <div className="flex flex-col gap-2 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />

              <Input
                className="pl-9"
                placeholder="Search order number, customer, business or location"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    loadOrders();
                  }
                }}
              />
            </div>

            <Select value={portalType} onValueChange={setPortalType}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Portals</SelectItem>
                <SelectItem value="household">Household</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="distributor">Distributor</SelectItem>
                <SelectItem value="whitelabel">White Label</SelectItem>
              </SelectContent>
            </Select>

            <Select value={orderStatus} onValueChange={setOrderStatus}>
              <SelectTrigger className="md:w-[180px]">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="pending_approval">
                  Pending Approval
                </SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="packed">Packed</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadOrders}>Search</Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex h-60 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Portal</TableHead>
                    <TableHead>Customer / Business</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map((order) => (
                      <TableRow key={`${order.portal_type}-${order.id}`}>
                        <TableCell>
                          <p className="font-medium">
                            {order.order_number || order.id}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {order.item_count || 0} item(s)
                            {order.location_name
                              ? ` · ${order.location_name}`
                              : ""}
                          </p>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {order.portal_type}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <p>
                            {order.customer_name ||
                              order.business_name ||
                              "Customer"}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            {order.customer_email ||
                              order.customer_phone ||
                              "—"}
                          </p>
                        </TableCell>

                        <TableCell className="font-medium">
                          {money(order.total_amount)}
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getBadgeClass(order.payment_status)}
                          >
                            {displayStatus(order.payment_status)}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getBadgeClass(order.order_status)}
                          >
                            {displayStatus(order.order_status)}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getBadgeClass(order.delivery_status)}
                          >
                            {displayStatus(order.delivery_status)}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-sm">
                          {dateTime(order.placed_at || order.created_at)}
                        </TableCell>

                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openOrderDetail(order)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="h-28 text-center text-muted-foreground"
                      >
                        No orders found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet
        open={Boolean(selectedOrder)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setOrderDetail(null);
            setTimeline([]);
            setNote("");
          }
        }}
      >
        <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>
              {selectedOrder?.order_number || selectedOrder?.id}
            </SheetTitle>

            <SheetDescription>
              {selectedOrder?.portal_type} order ·{" "}
              {selectedOrder?.customer_name ||
                selectedOrder?.business_name ||
                "Customer"}
            </SheetDescription>
          </SheetHeader>

          {loadingDetail ? (
            <div className="flex h-60 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              <div className="grid grid-cols-2 gap-3 rounded-lg border p-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order Amount</p>
                  <p className="font-semibold">
                    {money(
                      orderDetail?.total_amount ||
                        selectedOrder?.total_amount
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">
                    {String(
                      orderDetail?.location_name ||
                        selectedOrder?.location_name ||
                        "—"
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p>
                    {dateTime(
                      (orderDetail?.placed_at ||
                        orderDetail?.created_at ||
                        selectedOrder?.placed_at ||
                        selectedOrder?.created_at) as string
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">
                    {String(
                      orderDetail?.customer_name ||
                        selectedOrder?.customer_name ||
                        orderDetail?.business_name ||
                        selectedOrder?.business_name ||
                        "—"
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Update Order Status</h3>

                <Select
                  value={String(
                    orderDetail?.order_status ||
                      selectedOrder?.order_status ||
                      "pending"
                  )}
                  disabled={saving}
                  onValueChange={(value) => updateStatus("order", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Order status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="pending_approval">
                      Pending Approval
                    </SelectItem>
                    <SelectItem value="pending_admin_approval">
                      Pending Admin Approval
                    </SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="packed">Packed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="out_for_delivery">
                      Out For Delivery
                    </SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={String(
                    orderDetail?.payment_status ||
                      selectedOrder?.payment_status ||
                      "pending"
                  )}
                  disabled={saving}
                  onValueChange={(value) => updateStatus("payment", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Payment status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={String(
                    orderDetail?.delivery_status ||
                      selectedOrder?.delivery_status ||
                      "not_started"
                  )}
                  disabled={saving}
                  onValueChange={(value) => updateStatus("delivery", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Delivery status" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="not_started">Not Started</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="packed">Packed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="out_for_delivery">
                      Out For Delivery
                    </SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <h3 className="mb-2 font-medium">Ordered Items</h3>

                <div className="space-y-2 rounded-lg border p-3">
                  {orderItems.length ? (
                    orderItems.map((item, index) => (
                      <div
                        key={String(item.id || index)}
                        className="flex items-start justify-between gap-3 border-b pb-2 last:border-0"
                      >
                        <div>
                          <p className="font-medium">
                            {String(
                              item.product_name ||
                                item.sku ||
                                `Item ${index + 1}`
                            )}
                          </p>

                          <p className="text-xs text-muted-foreground">
                            SKU: {String(item.sku || "—")} · Qty:{" "}
                            {Number(item.quantity || item.qty || 1)}
                          </p>
                        </div>

                        <p className="font-medium">
                          {money(
                            item.total_amount ||
                              item.line_total ||
                              item.selling_price ||
                              item.unit_price ||
                              item.price
                          )}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No item details returned by backend.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-medium">Add Admin Note</h3>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add operational note for this order"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />

                  <Button
                    onClick={addNote}
                    disabled={!note.trim() || saving}
                  >
                    <MessageSquarePlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-medium">Order Timeline</h3>

                <div className="space-y-3 rounded-lg border p-3">
                  {timeline.length ? (
                    timeline.map((event, index) => (
                      <div
                        key={event.id || `${event.event_type}-${index}`}
                        className="border-b pb-3 last:border-b-0 last:pb-0"
                      >
                        <p className="font-medium">
                          {displayStatus(event.event_type)}
                        </p>

                        {event.previous_value || event.new_value ? (
                          <p className="text-xs text-muted-foreground">
                            {event.previous_value || "—"} →{" "}
                            {event.new_value || "—"}
                          </p>
                        ) : null}

                        {event.note ? (
                          <p className="mt-1 text-sm">{event.note}</p>
                        ) : null}

                        <p className="mt-1 text-xs text-muted-foreground">
                          {dateTime(event.created_at)}
                          {event.created_by_name
                            ? ` · ${event.created_by_name}`
                            : ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No order timeline entries yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}