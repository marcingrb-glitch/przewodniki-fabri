import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download, Eye, FileText, Tag, Package } from "lucide-react";
import { DecodedSKU } from "@/types";
import { getOrderById } from "@/utils/supabaseQueries";
import { SEATS_PUFA } from "@/data/mappings";

const DisabledButton = ({ children, tooltip }: { children: React.ReactNode; tooltip: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span tabIndex={0}>
        <Button variant="outline" size="sm" disabled className="gap-1.5">
          {children}
        </Button>
      </span>
    </TooltipTrigger>
    <TooltipContent>{tooltip}</TooltipContent>
  </Tooltip>
);

const OrderDetailsPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const stateDecoded = (location.state as { decoded?: DecodedSKU })?.decoded;

  const { data: order, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: () => getOrderById(id!),
    enabled: !stateDecoded && !!id,
  });

  const decoded: DecodedSKU | undefined = stateDecoded || (order?.decoded_data as unknown as DecodedSKU);

  if (isLoading && !stateDecoded) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!decoded) {
    return (
      <Card className="shadow-md">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Nie znaleziono danych zamówienia.</p>
          <Button variant="link" onClick={() => navigate("/")}>Wróć do strony głównej</Button>
        </CardContent>
      </Card>
    );
  }

  const seatKey = decoded.seat.code;
  const pufaSeat = SEATS_PUFA[seatKey];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-md">
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-2xl">
                ZAMÓWIENIE: {decoded.orderNumber || order?.order_number}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                SKU: <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{decoded.rawSKU || order?.sku}</code>
              </p>
              <p className="text-sm text-muted-foreground">
                Data: {decoded.orderDate || (order?.order_date ? new Date(order.order_date).toLocaleDateString("pl-PL") : "")}
              </p>
            </div>
            <Badge variant="secondary" className="self-start text-sm">
              {decoded.series.code} - {decoded.series.name} [{decoded.series.collection}]
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* SOFA */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">🛋️ SOFA - {decoded.series.code} {decoded.series.name} [{decoded.series.collection}]</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" defaultValue="decoding" collapsible>
            <AccordionItem value="decoding">
              <AccordionTrigger className="text-base font-semibold">Dekodowanie SKU</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <InfoRow label="Seria" value={`${decoded.series.code} - ${decoded.series.name} [${decoded.series.collection}]`} />
                  <InfoRow label="Tkanina" value={`${decoded.fabric.code}${decoded.fabric.color} - ${decoded.fabric.name}, kolor ${decoded.fabric.colorName}`} />
                  <InfoRow label="Siedzisko" value={`${decoded.seat.code} - ${decoded.seat.typeName}, wykończenie ${decoded.seat.finish} (${decoded.seat.finishName})`} />
                  <InfoRow label="Boczek" value={`${decoded.side.code}${decoded.side.finish} - ${decoded.side.name}, wykończenie ${decoded.side.finishName}`} />
                  <InfoRow label="Oparcie" value={`${decoded.backrest.code}${decoded.backrest.finish} - ${decoded.backrest.height}cm, wykończenie ${decoded.backrest.finishName}`} />
                  <InfoRow label="Skrzynia" value={decoded.chest.code} />
                  <InfoRow label="Automat" value={`${decoded.automat.code} - ${decoded.automat.name}`} />
                  {decoded.legs && (
                    <InfoRow label="Nóżki" value={`${decoded.legs.code}${decoded.legs.color || ""} - ${decoded.legs.name} ${decoded.legs.material}${decoded.legs.colorName ? `, ${decoded.legs.colorName}` : ""}`} />
                  )}
                  {decoded.pillow && (
                    <InfoRow label="Poduszka oparciowa" value={`${decoded.pillow.code} - ${decoded.pillow.name}`} />
                  )}
                  {decoded.jaski && (
                    <InfoRow label="Jaśki" value={`${decoded.jaski.code} - ${decoded.jaski.name}`} />
                  )}
                  {decoded.walek && (
                    <InfoRow label="Wałek" value={decoded.walek.code} />
                  )}
                  <div className="mt-3 border-t pt-3">
                    <p className="font-semibold mb-1">Nóżki sofy:</p>
                    {decoded.legHeights.sofa_chest ? (
                      <InfoRow label="Pod skrzynią" value={`${decoded.legHeights.sofa_chest.leg} H ${decoded.legHeights.sofa_chest.height}cm (${decoded.legHeights.sofa_chest.count} szt)`} />
                    ) : (
                      <InfoRow label="Pod skrzynią" value="BRAK" />
                    )}
                    {decoded.legHeights.sofa_seat ? (
                      <InfoRow label="Pod siedziskiem" value={`${decoded.legHeights.sofa_seat.leg} H ${decoded.legHeights.sofa_seat.height}cm (${decoded.legHeights.sofa_seat.count} szt)`} />
                    ) : (
                      <InfoRow label="Pod siedziskiem" value="BRAK (AT2)" />
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <div className="mt-4 flex flex-wrap gap-2">
            <DisabledButton tooltip="Dostępne w Etapie 3"><Eye className="h-4 w-4" /> Podgląd przewodnika</DisabledButton>
            <DisabledButton tooltip="Dostępne w Etapie 3"><Download className="h-4 w-4" /> Pobierz przewodnik</DisabledButton>
            <DisabledButton tooltip="Dostępne w Etapie 3"><Eye className="h-4 w-4" /> Podgląd etykiet</DisabledButton>
            <DisabledButton tooltip="Dostępne w Etapie 3"><Tag className="h-4 w-4" /> Pobierz etykiety</DisabledButton>
          </div>
        </CardContent>
      </Card>

      {/* PUFA */}
      {decoded.pufaSKU && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">🪑 PUFA - {decoded.pufaSKU}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" defaultValue="pufa-decoding" collapsible>
              <AccordionItem value="pufa-decoding">
                <AccordionTrigger className="text-base font-semibold">Dekodowanie SKU pufy</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <InfoRow label="Seria" value={`${decoded.series.code} - ${decoded.series.name}`} />
                    <InfoRow label="Tkanina" value={`${decoded.fabric.code}${decoded.fabric.color} - ${decoded.fabric.name}, ${decoded.fabric.colorName}`} />
                    <InfoRow label="Siedzisko" value={`${decoded.seat.code} - ${decoded.seat.typeName}`} />
                    {pufaSeat && (
                      <>
                        <InfoRow label="Front/Tył" value={pufaSeat.frontBack} />
                        <InfoRow label="Boki" value={pufaSeat.sides} />
                        <InfoRow label="Pianka bazowa" value={pufaSeat.foam} />
                        <InfoRow label="Skrzynka" value={pufaSeat.box} />
                      </>
                    )}
                    {decoded.legs && (
                      <InfoRow label="Nóżki" value={`${decoded.legs.code}${decoded.legs.color || ""} H 16cm (4 szt)`} />
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="mt-4 flex flex-wrap gap-2">
              <DisabledButton tooltip="Dostępne w Etapie 3"><Eye className="h-4 w-4" /> Podgląd przewodnika</DisabledButton>
              <DisabledButton tooltip="Dostępne w Etapie 3"><Download className="h-4 w-4" /> Pobierz przewodnik</DisabledButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FOTEL */}
      {decoded.fotelSKU && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-xl">💺 FOTEL - {decoded.fotelSKU}</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" defaultValue="fotel-decoding" collapsible>
              <AccordionItem value="fotel-decoding">
                <AccordionTrigger className="text-base font-semibold">Dekodowanie SKU fotela</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm">
                    <InfoRow label="Seria" value={`${decoded.series.code} - ${decoded.series.name}`} />
                    <InfoRow label="Tkanina" value={`${decoded.fabric.code}${decoded.fabric.color} - ${decoded.fabric.name}, ${decoded.fabric.colorName}`} />
                    <InfoRow label="Siedzisko" value={`${decoded.seat.code} - ${decoded.seat.typeName}`} />
                    <InfoRow label="Boczek" value={`${decoded.side.code}${decoded.side.finish} - ${decoded.side.name}`} />
                    {decoded.jaski && (
                      <InfoRow label="Jaśki" value={`${decoded.jaski.code} - ${decoded.jaski.name}`} />
                    )}
                    {decoded.legs && (
                      <InfoRow label="Nóżki" value={`${decoded.legs.code}${decoded.legs.color || ""} H 16cm (4 szt)`} />
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <div className="mt-4 flex flex-wrap gap-2">
              <DisabledButton tooltip="Dostępne w Etapie 3"><Eye className="h-4 w-4" /> Podgląd przewodnika</DisabledButton>
              <DisabledButton tooltip="Dostępne w Etapie 3"><Download className="h-4 w-4" /> Pobierz przewodnik</DisabledButton>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary actions */}
      <Card className="shadow-md">
        <CardContent className="flex flex-wrap items-center gap-3 pt-6">
          <DisabledButton tooltip="Dostępne w Etapie 3"><FileText className="h-4 w-4" /> Pobierz wszystkie przewodniki</DisabledButton>
          <DisabledButton tooltip="Dostępne w Etapie 3"><Tag className="h-4 w-4" /> Pobierz wszystkie etykiety</DisabledButton>
          <DisabledButton tooltip="Dostępne w Etapie 3"><Package className="h-4 w-4" /> Pobierz wszystko (ZIP)</DisabledButton>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => navigate("/")} className="gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Nowe zamówienie
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex gap-2">
    <span className="font-medium text-muted-foreground min-w-[140px]">{label}:</span>
    <span>{value}</span>
  </div>
);

export default OrderDetailsPage;
