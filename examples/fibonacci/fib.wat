(module
 (type $i32_=>_i32 (func (param i32) (result i32)))
 (memory $0 1 16)
 (export "memory" (memory $0))
 (export "fibonacci" (func $module/fibonacci))
 (func $module/fibonacci (; has Stack IR ;) (param $0 i32) (result i32)
  (local $1 i32)
  (local $2 i32)
  (local $3 i32)
  (local.set $1
   (i32.const 1)
  )
  (if
   (i32.gt_s
    (local.get $0)
    (i32.const 0)
   )
   (block
    (loop $loop/ckol5q0h500008xljdltldnad
     (local.set $3
      (i32.add
       (local.get $1)
       (local.get $2)
      )
     )
     (local.set $2
      (local.get $1)
     )
     (local.set $1
      (local.get $3)
     )
     (br_if $loop/ckol5q0h500008xljdltldnad
      (i32.le_s
       (local.tee $0
        (i32.sub
         (local.get $0)
         (i32.const 1)
        )
       )
       (i32.const 0)
      )
     )
    )
    (return
     (local.get $1)
    )
   )
  )
  (i32.const 0)
 )
)
