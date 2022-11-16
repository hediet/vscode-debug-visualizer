require 'debugvisualizer'

class Foo; end

DebugVisualizer.register Foo do |data|
  {
    id: "my_visualizer",
    name: "My Visualizer",
    data: {
        kind: { text: true },
        text: "Foo"
    }
  }
end

f = Foo.new
# visualize `f` here!
binding.break
