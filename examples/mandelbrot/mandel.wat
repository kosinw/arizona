(module
 (type $f64_=>_f64 (func (param f64) (result f64)))
 (type $i32_=>_none (func (param i32)))
 (type $i32_i32_i32_=>_none (func (param i32 i32 i32)))
 (type $i32_i32_=>_i32 (func (param i32 i32) (result i32)))
 (type $f64_f64_f64_=>_f64 (func (param f64 f64 f64) (result f64)))
 (import "env" "memory" (memory $0 0))
 (import "env" "clamp" (func $module/clamp (param f64 f64 f64) (result f64)))
 (import "Math" "log2" (func $module/log2 (param f64) (result f64)))
 (import "Math" "log" (func $module/log (param f64) (result f64)))
 (import "env" "min" (func $module/min (param i32 i32) (result i32)))
 (import "env" "logi" (func $module/logi (param i32)))
 (global $module/NUM_COLORS i32 (i32.const 2048))
 (export "memory" (memory $0))
 (export "update" (func $module/update))
 (func $module/update (param $0 i32) (param $1 i32) (param $2 i32)
  (local $3 f64)
  (local $4 f64)
  (local $5 f64)
  (local $6 f64)
  (local $7 f64)
  (local $8 i32)
  (local $9 i32)
  (local $10 f64)
  (local $11 i32)
  (local $12 i32)
  (local $13 i32)
  (local $14 f64)
  (local $15 f64)
  (local $16 i32)
  (local $17 f64)
  (local $18 f64)
  (local $19 f64)
  (local $20 i32)
  (local $21 f64)
  (local $22 f64)
  local.get $0
  f64.convert_i32_s
  f64.const 1
  f64.const 1.6
  f64.div
  f64.mul
  local.set $3
  local.get $1
  f64.convert_i32_s
  f64.const 1
  f64.const 2
  f64.div
  f64.mul
  local.set $4
  f64.const 10
  i32.const 3
  local.get $0
  i32.mul
  i32.const 4
  local.get $1
  i32.mul
  call $module/min
  f64.convert_i32_s
  f64.div
  local.set $5
  local.get $3
  local.get $5
  f64.mul
  local.set $6
  f64.const 1
  local.get $2
  f64.convert_i32_s
  f64.div
  local.set $7
  i32.const 8
  local.get $2
  call $module/min
  local.set $8
  block $loop/0/break
   i32.const 0
   local.set $9
   loop $loop/0
    local.get $9
    local.get $1
    i32.lt_u
    i32.const 0
    i32.eq
    br_if $loop/0/break
    block
     local.get $9
     f64.convert_i32_s
     local.get $4
     f64.sub
     local.get $5
     f64.mul
     local.set $10
     local.get $9
     local.get $0
     i32.mul
     i32.const 1
     i32.shl
     local.set $11
     block $loop/1/break
      i32.const 0
      local.set $12
      loop $loop/1
       local.get $12
       local.get $0
       i32.lt_u
       i32.const 0
       i32.eq
       br_if $loop/1/break
       block
        local.get $12
        f64.convert_i32_s
        local.get $5
        f64.mul
        local.get $6
        f64.sub
        i32.trunc_f64_s
        local.set $13
        f64.const 0
        local.set $14
        f64.const 0
        local.set $15
        i32.const 0
        local.set $16
        i32.const 0
        f64.convert_i32_s
        local.set $17
        i32.const 0
        f64.convert_i32_s
        local.set $18
        block $loop/2/break
         nop
         loop $loop/2
          local.get $14
          local.get $14
          f64.mul
          local.get $15
          local.get $15
          f64.mul
          f64.add
          f64.const 4
          f64.le
          i32.const 0
          i32.eq
          br_if $loop/2/break
          block
           local.get $14
           local.get $14
           f64.mul
           local.set $17
           local.get $15
           local.get $15
           f64.mul
           local.set $18
           f64.const 2
           local.get $14
           f64.mul
           local.get $15
           f64.mul
           local.get $10
           f64.add
           local.set $15
           local.get $17
           local.get $18
           f64.sub
           local.get $13
           f64.convert_i32_s
           f64.add
           local.set $14
           local.get $16
           local.get $2
           i32.ge_u
           if
            br $loop/2/break
           end
           local.get $16
           i32.const 1
           i32.add
           local.set $16
          end
          nop
          br $loop/2
         end
         unreachable
        end
        block $loop/3/break
         nop
         loop $loop/3
          local.get $16
          local.get $8
          i32.lt_u
          i32.const 0
          i32.eq
          br_if $loop/3/break
          block
           local.get $14
           local.get $14
           f64.mul
           local.get $15
           local.get $15
           f64.mul
           f64.sub
           local.get $13
           f64.convert_i32_s
           f64.add
           local.set $19
           f64.const 2
           local.get $14
           f64.mul
           local.get $15
           f64.mul
           local.get $10
           f64.add
           local.set $15
           local.get $19
           local.set $14
           local.get $16
           i32.const 1
           i32.add
           local.set $16
          end
          nop
          br $loop/3
         end
         unreachable
        end
        global.get $module/NUM_COLORS
        i32.const 1
        i32.sub
        local.set $20
        local.get $14
        local.get $14
        f64.mul
        local.get $15
        local.get $15
        f64.mul
        f64.add
        local.set $21
        local.get $21
        f64.const 1
        f64.gt
        if
         f64.const 0.5
         local.get $21
         call $module/log
         f64.mul
         call $module/log2
         local.set $22
         global.get $module/NUM_COLORS
         i32.const 1
         i32.sub
         f64.convert_i32_s
         local.get $16
         i32.const 1
         i32.add
         f64.convert_i32_s
         local.get $22
         f64.sub
         local.get $7
         f64.mul
         f64.const 0
         f64.const 1
         call $module/clamp
         f64.mul
         i32.trunc_f64_s
         local.set $20
        end
        local.get $11
        local.get $12
        i32.const 1
        i32.shl
        i32.add
        local.get $20
        i32.store16
       end
       local.get $12
       i32.const 1
       i32.add
       local.set $12
       br $loop/1
      end
      unreachable
     end
    end
    local.get $9
    i32.const 1
    i32.add
    local.set $9
    br $loop/0
   end
   unreachable
  end
 )
)
