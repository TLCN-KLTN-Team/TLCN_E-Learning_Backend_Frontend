"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, Trash2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "react-toastify"
import {
  addBlueprintEntry,
  getQuizBlueprint,
  removeBlueprintEntry,
  updateBlueprintEntry,
  validateBlueprint,
} from "@/services/api/teacher/quizBlueprintApi"
import { getTeacherActiveClos, type CourseObjectiveResponse } from "@/services/api/teacher/courseObjectiveApi"

type BlueprintRow = {
  id?: number
  cloId: number
  percentage: number
}

interface QuizBlueprintConfigProps {
  quizId: number
  courseId: number
}

const QuizBlueprintConfig: React.FC<QuizBlueprintConfigProps> = ({ quizId, courseId }) => {
  const [rows, setRows] = useState<BlueprintRow[]>([])
  const [clos, setClos] = useState<CourseObjectiveResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validating, setValidating] = useState(false)

  const filteredClos = useMemo(
    () => clos.filter((clo) => clo.courseId === courseId),
    [clos, courseId]
  )

  const totalPercentage = useMemo(
    () => rows.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0),
    [rows]
  )

  const selectedCloIds = useMemo(() => new Set(rows.map((r) => r.cloId)), [rows])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [cloData, blueprintData] = await Promise.all([
        getTeacherActiveClos(),
        getQuizBlueprint(quizId),
      ])

      setClos(cloData)
      setRows(
        blueprintData.map((item) => ({
          id: item.id,
          cloId: item.cloId,
          percentage: item.percentage,
        }))
      )
    } catch (error) {
      console.error("Error loading blueprint data:", error)
      toast.error("Không thể tải dữ liệu ma trận CLO")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [quizId])

  const addRow = () => {
    const firstAvailable = filteredClos.find((clo) => !selectedCloIds.has(clo.id))
    if (!firstAvailable) {
      toast.warning("Tất cả CĐR của khóa học đã được thêm")
      return
    }

    setRows((prev) => [...prev, { cloId: firstAvailable.id, percentage: 0 }])
  }

  const removeRow = async (index: number) => {
    const row = rows[index]
    if (!row) return

    try {
      if (row.id) {
        await removeBlueprintEntry(quizId, row.cloId)
      }
      setRows((prev) => prev.filter((_, idx) => idx !== index))
      toast.success("Đã xóa dòng blueprint")
    } catch (error) {
      console.error("Error removing blueprint row:", error)
      toast.error("Không thể xóa dòng blueprint")
    }
  }

  const updateRow = (index: number, patch: Partial<BlueprintRow>) => {
    setRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)))
  }

  const saveAll = async () => {
    try {
      setSaving(true)

      for (const row of rows) {
        if (!row.cloId) continue

        if (row.id) {
          await updateBlueprintEntry(quizId, row.cloId, {
            cloId: row.cloId,
            percentage: Number(row.percentage) || 0,
          })
        } else {
          await addBlueprintEntry(quizId, {
            cloId: row.cloId,
            percentage: Number(row.percentage) || 0,
          })
        }
      }

      await fetchData()
      toast.success("Đã lưu cấu hình ma trận CĐR")
    } catch (error) {
      console.error("Error saving blueprint:", error)
      toast.error("Không thể lưu ma trận CĐR")
    } finally {
      setSaving(false)
    }
  }

  const runValidate = async () => {
    try {
      setValidating(true)
      const result = await validateBlueprint(quizId)
      if (result.valid) {
        toast.success("Blueprint hợp lệ (tổng = 100%)")
      } else {
        toast.warning(result.message || "Blueprint chưa hợp lệ")
      }
    } catch (error: any) {
      console.error("Blueprint validation failed:", error)
      const message = error?.response?.data?.message || "Blueprint chưa đủ 100% hoặc chưa hợp lệ"
      toast.error(message)
    } finally {
      setValidating(false)
    }
  }

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-blue-700 font-medium">Ma trận CĐR</p>
        <span className={`text-xs font-semibold ${totalPercentage === 100 ? "text-green-700" : "text-yellow-700"}`}>
          Tổng: {totalPercentage}%
        </span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          Đang tải dữ liệu ma trận...
        </div>
      ) : (
        <>
          {rows.length === 0 ? (
            <p className="text-sm text-blue-700">Chưa có cấu hình ma trận. Bạn có thể thêm ngay khi chỉnh sửa quiz.</p>
          ) : (
            <div className="space-y-2">
              {rows.map((row, index) => (
                <div key={`${row.id || "new"}-${index}`} className="grid grid-cols-12 gap-2 items-end bg-white rounded border p-2">
                  <div className="col-span-7">
                    <Label className="text-xs">CĐR</Label>
                    <Select
                      value={String(row.cloId)}
                      onValueChange={(value) => updateRow(index, { cloId: Number(value) })}
                    >
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Chọn CĐR" />
                      </SelectTrigger>
                      <SelectContent className="bg-white z-50">
                        {filteredClos
                          .filter((clo) => clo.id === row.cloId || !selectedCloIds.has(clo.id))
                          .map((clo) => (
                            <SelectItem key={clo.id} value={String(clo.id)}>
                              {clo.code} - {clo.description || `Khóa học #${clo.courseId}`}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-3">
                    <Label className="text-xs">Tỷ lệ (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={row.percentage}
                      onChange={(e) => updateRow(index, { percentage: Math.max(0, Number(e.target.value) || 0) })}
                    />
                  </div>

                  <div className="col-span-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeRow(index)}
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      title="Xóa dòng"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={addRow}>
              <Plus className="h-4 w-4 mr-2" />
              Thêm CĐR
            </Button>

            <Button type="button" onClick={saveAll} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Lưu ma trận
            </Button>

            <Button type="button" variant="secondary" onClick={runValidate} disabled={validating}>
              {validating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <AlertCircle className="h-4 w-4 mr-2" />}
              Kiểm tra 100%
            </Button>
          </div>

          <p className="text-xs text-blue-700">
            Gợi ý: lưu ma trận trước, sau đó bấm kiểm tra để xác nhận tổng tỷ lệ CĐR bằng 100%.
          </p>
        </>
      )}
    </div>
  )
}

export default QuizBlueprintConfig
