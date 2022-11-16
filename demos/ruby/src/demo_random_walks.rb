data = []
curVal = 0

100.times{
  100.times{
    delta = rand > 0.5 ? 1 : -1
    data << curVal
    curVal += delta
    # visualize `data` here and press F5(or Continue button) over and over!
    binding.break
  }
}
