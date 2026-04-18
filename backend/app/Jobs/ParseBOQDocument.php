<?php

namespace App\Jobs;

use App\Models\ProjectDocument;
use App\Models\ProjectMaterialEstimate;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Smalot\PdfParser\Parser;
use Throwable;

class ParseBOQDocument implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected int $documentId)
    {
    }

    public function handle(): void
    {
        $document = ProjectDocument::find($this->documentId);

        if (!$document) {
            return;
        }

        $document->update(['parsed_status' => 'processing']);

        try {
            $storagePath = str_replace('/storage/', '', $document->file_path);
            $absolutePath = Storage::disk('public')->path($storagePath);
            $extension = strtolower(pathinfo($absolutePath, PATHINFO_EXTENSION));

            $rows = match ($extension) {
                'pdf' => $this->parsePdf($absolutePath),
                'xls', 'xlsx', 'csv' => $this->parseSpreadsheet($absolutePath),
                default => collect(),
            };

            $estimates = $rows
                ->map(fn ($row) => $this->normalizeEstimateRow($row))
                ->filter()
                ->values();

            ProjectMaterialEstimate::where('project_document_id', $document->id)->delete();

            foreach ($estimates as $estimate) {
                ProjectMaterialEstimate::create([
                    'project_id' => $document->project_id,
                    'project_document_id' => $document->id,
                    'material_name' => $estimate['material_name'],
                    'estimated_quantity' => $estimate['estimated_quantity'],
                    'estimated_unit_price' => $estimate['estimated_unit_price'],
                    'unit' => $estimate['unit'],
                ]);
            }

            $document->update([
                'parsed_status' => $estimates->isEmpty() ? 'failed' : 'completed',
            ]);
        } catch (Throwable $exception) {
            $document->update(['parsed_status' => 'failed']);
            report($exception);
        }
    }

    protected function parsePdf(string $path): Collection
    {
        $text = (new Parser())->parseFile($path)->getText();
        $lines = preg_split('/\r\n|\r|\n/', $text) ?: [];

        return collect($lines)
            ->map(fn ($line) => trim(preg_replace('/\s+/', ' ', $line)))
            ->filter(fn ($line) => $line !== '' && preg_match('/\d/', $line))
            ->map(function ($line) {
                $segments = preg_split('/\s{2,}|,/', $line) ?: [];

                if (count($segments) >= 4) {
                    return $segments;
                }

                preg_match('/^(.*?)(\d+(?:\.\d+)?)\s+([A-Za-z]+)\s+(\d+(?:\.\d+)?)$/', $line, $matches);

                return [
                    $matches[1] ?? $line,
                    $matches[2] ?? null,
                    $matches[3] ?? null,
                    $matches[4] ?? null,
                ];
            });
    }

    protected function parseSpreadsheet(string $path): Collection
    {
        $spreadsheet = IOFactory::load($path);
        $sheet = $spreadsheet->getActiveSheet();
        $rows = collect($sheet->toArray(null, true, true, true));

        return $rows
            ->skip(1)
            ->map(function ($row) {
                return collect($row)
                    ->values()
                    ->map(fn ($value) => is_string($value) ? trim($value) : $value)
                    ->filter(fn ($value) => $value !== null && $value !== '')
                    ->values()
                    ->all();
            })
            ->filter();
    }

    protected function normalizeEstimateRow(array $row): ?array
    {
        $cells = collect($row)->values();

        if ($cells->count() < 3) {
            return null;
        }

        $materialName = (string) $cells->get(0);
        $quantity = $this->toNumber($cells->get(1));
        $unit = (string) ($cells->get(2) ?? 'unit');
        $unitPrice = $this->toNumber($cells->get(3));

        if ($quantity === null || $materialName === '') {
            return null;
        }

        return [
            'material_name' => $materialName,
            'estimated_quantity' => $quantity,
            'unit' => $unit !== '' ? $unit : 'unit',
            'estimated_unit_price' => $unitPrice ?? 0,
        ];
    }

    protected function toNumber(mixed $value): ?float
    {
        if (is_numeric($value)) {
            return (float) $value;
        }

        if (!is_string($value)) {
            return null;
        }

        $clean = preg_replace('/[^0-9.\-]/', '', $value);

        return is_numeric($clean) ? (float) $clean : null;
    }
}
